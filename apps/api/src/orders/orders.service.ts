import { Injectable } from "@nestjs/common";
import { OrderStatus, Prisma, Role, VerificationStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { env } from "../config/env";
import {
  BusinessRuleError,
  ConcurrencyError,
  ErrorCode,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../common/errors";
import { computeFeeKobo, computeSubtotalKobo, evaluateDeliveryVariance, parseLitres } from "../common/money";
import type { RequestUser } from "../auth/request.types";
import {
  AllocateOrderInput,
  CancelOrderInput,
  ConfirmDeliveryInput,
  CreateOrderInput,
  DispatchOrderInput,
  ListOrdersQuery,
} from "./dto";

/**
 * Order lifecycle.
 *
 * Every transition is permission-checked and appends an immutable OrderEvent,
 * so an order's history can always be reconstructed for a dispute.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.AWAITING_PAYMENT, OrderStatus.CANCELLED],
  [OrderStatus.AWAITING_PAYMENT]: [OrderStatus.ESCROW_FUNDED, OrderStatus.CANCELLED],
  [OrderStatus.ESCROW_FUNDED]: [OrderStatus.ALLOCATED, OrderStatus.CANCELLED, OrderStatus.DISPUTED],
  [OrderStatus.ALLOCATED]: [OrderStatus.LOADING, OrderStatus.CANCELLED, OrderStatus.DISPUTED],
  [OrderStatus.LOADING]: [OrderStatus.IN_TRANSIT, OrderStatus.DISPUTED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.DISPUTED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.DISPUTED],
  [OrderStatus.DISPUTED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

/** Statuses where stock is committed to this order and must stay reserved. */
const RESERVING_STATUSES: OrderStatus[] = [
  OrderStatus.AWAITING_PAYMENT,
  OrderStatus.ESCROW_FUNDED,
  OrderStatus.ALLOCATED,
  OrderStatus.LOADING,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
  OrderStatus.DISPUTED,
];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  // -------------------------------------------------------------------------
  // Creation
  // -------------------------------------------------------------------------

  /**
   * Places an order against a listing.
   *
   * Inventory is reserved with a single conditional UPDATE inside the
   * transaction. Two buyers racing for the last litres cannot both succeed:
   * the second update matches zero rows and is rejected. This is the most
   * important correctness property in the system — overselling means a truck
   * turns up to an empty tank.
   */
  async create(buyerOrgId: string, input: CreateOrderInput, actor: RequestUser) {
    const quantity = parseLitres(input.quantityLitres, "Quantity");

    return this.prisma.$transaction(
      async (tx) => {
        const listing = await tx.productListing.findUnique({
          where: { id: input.listingId },
          include: { depot: { include: { org: true } } },
        });
        if (!listing) throw new NotFoundError("Listing");

        // --- Eligibility ---
        if (listing.depot.orgId === buyerOrgId) {
          throw new BusinessRuleError("You cannot buy from your own organisation");
        }
        if (!listing.isActive || !listing.depot.isActive) {
          throw new BusinessRuleError("This listing is no longer available");
        }
        if (listing.depot.org.verificationStatus !== VerificationStatus.VERIFIED) {
          throw new BusinessRuleError("This seller is not currently verified");
        }
        if (listing.validUntil.getTime() <= Date.now()) {
          throw new BusinessRuleError(
            "This price has expired. Refresh the listing for current pricing.",
            ErrorCode.LISTING_EXPIRED
          );
        }

        // --- Price protection: refuse to fill at a price the buyer never saw ---
        if (
          input.expectedPricePerLitreKobo !== undefined &&
          BigInt(input.expectedPricePerLitreKobo) !== listing.pricePerLitreKobo
        ) {
          throw new BusinessRuleError(
            `The price changed while you were ordering (now ${listing.pricePerLitreKobo.toString()} kobo/L). Review and resubmit.`,
            ErrorCode.CONFLICT
          );
        }

        // --- Order-size rules ---
        if (quantity.lessThan(listing.minOrderLitres)) {
          throw new BusinessRuleError(
            `This depot's minimum order is ${listing.minOrderLitres.toString()} L`
          );
        }
        if (listing.maxOrderLitres && quantity.greaterThan(listing.maxOrderLitres)) {
          throw new BusinessRuleError(
            `This depot's maximum order is ${listing.maxOrderLitres.toString()} L`
          );
        }

        const sellable = listing.availableLitres.minus(listing.reservedLitres);
        if (quantity.greaterThan(sellable)) {
          throw new BusinessRuleError(
            `Only ${sellable.toString()} L is available on this listing`,
            ErrorCode.INSUFFICIENT_INVENTORY
          );
        }

        // --- Atomic reservation ---
        // The WHERE clause re-checks availability at write time, so a
        // concurrent order that consumed the stock makes this match 0 rows.
        const reserved = await tx.$executeRaw`
          UPDATE product_listings
             SET "reservedLitres" = "reservedLitres" + ${quantity},
                 version = version + 1,
                 "updatedAt" = NOW()
           WHERE id = ${listing.id}
             AND "isActive" = true
             AND "validUntil" > NOW()
             AND "availableLitres" - "reservedLitres" >= ${quantity}
        `;
        if (reserved === 0) {
          throw new BusinessRuleError(
            "That volume was just taken by another buyer. Refresh and try again.",
            ErrorCode.INSUFFICIENT_INVENTORY
          );
        }

        // --- Pricing (integer arithmetic only) ---
        const subtotalKobo = computeSubtotalKobo(quantity, listing.pricePerLitreKobo);
        const feePolicy = await this.resolveFeePolicy(tx, listing.product);
        const feeKobo = computeFeeKobo(subtotalKobo, feePolicy);

        const order = await tx.order.create({
          data: {
            ref: this.generateRef(),
            buyerOrgId,
            sellerOrgId: listing.depot.orgId,
            depotId: listing.depotId,
            listingId: listing.id,
            product: listing.product,
            quantityLitres: quantity,
            pricePerLitreKobo: listing.pricePerLitreKobo,
            subtotalKobo,
            feeKobo,
            // The buyer funds goods + platform fee.
            totalKobo: subtotalKobo + feeKobo,
            status: OrderStatus.AWAITING_PAYMENT,
            deliveryState: input.deliveryState ?? null,
            deliveryLga: input.deliveryLga ?? null,
            deliveryAddress: input.deliveryAddress ?? null,
            expectedLoadingDate: input.expectedLoadingDate ?? null,
            createdById: actor.id,
          },
        });

        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            fromStatus: null,
            toStatus: OrderStatus.AWAITING_PAYMENT,
            note: "Order placed; awaiting escrow funding",
            actorUserId: actor.id,
            actorOrgId: buyerOrgId,
            metadata: {
              quantityLitres: quantity.toString(),
              pricePerLitreKobo: listing.pricePerLitreKobo.toString(),
              feeKobo: feeKobo.toString(),
            },
          },
        });

        await this.audit.record(
          {
            action: "order.created",
            entityType: "Order",
            entityId: order.id,
            actorUserId: actor.id,
            actorOrgId: buyerOrgId,
            changes: {
              ref: order.ref,
              totalKobo: order.totalKobo.toString(),
              quantityLitres: quantity.toString(),
            },
          },
          tx
        );

        return order;
      },
      // Serializable would be stricter, but the conditional UPDATE already
      // makes the reservation safe, and this avoids serialization failures
      // under normal marketplace concurrency.
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15_000 }
    );
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  async list(actor: RequestUser, orgId: string | null, query: ListOrdersQuery) {
    const where: Prisma.OrderWhereInput = {
      status: query.status,
      product: query.product,
      depotId: query.depotId,
      ...(query.from || query.to
        ? { createdAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
        : {}),
      ...(query.search ? { ref: { contains: query.search, mode: Prisma.QueryMode.insensitive } } : {}),
    };

    // Scoping: an admin sees everything; everyone else sees only orders their
    // organisation is a party to.
    if (actor.role !== Role.ADMIN) {
      if (!orgId) throw new ForbiddenError("Select an organisation for this request");
      where.OR = [{ buyerOrgId: orgId }, { sellerOrgId: orgId }];
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput =
      query.sort === "oldest" ? { createdAt: "asc" } : query.sort === "value_desc" ? { totalKobo: "desc" } : { createdAt: "desc" };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          depot: { select: { id: true, name: true, state: true } },
          buyerOrg: { select: { id: true, name: true } },
          sellerOrg: { select: { id: true, name: true } },
          delivery: true,
        },
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async get(orderId: string, actor: RequestUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        depot: { select: { id: true, name: true, state: true, address: true, contactPhone: true } },
        buyerOrg: { select: { id: true, name: true, phone: true } },
        sellerOrg: { select: { id: true, name: true, phone: true } },
        delivery: true,
        dispute: true,
        documents: { select: { id: true, type: true, fileName: true, createdAt: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) throw new NotFoundError("Order");
    this.assertParty(order, actor);
    return order;
  }

  // -------------------------------------------------------------------------
  // Transitions
  // -------------------------------------------------------------------------

  /**
   * Cancels an order and releases the reserved stock.
   *
   * Only permitted before the money is held: once escrow is funded a
   * cancellation is a refund decision, which goes through disputes/admin.
   */
  async cancel(orderId: string, input: CancelOrderInput, actor: RequestUser) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundError("Order");
      this.assertParty(order, actor);

      const isBuyer = this.isBuyer(order, actor);
      const isAdmin = actor.role === Role.ADMIN;

      if (order.status === OrderStatus.AWAITING_PAYMENT) {
        if (!isBuyer && !isAdmin && !this.isSeller(order, actor)) {
          throw new ForbiddenError("Only a party to this order can cancel it");
        }
      } else if (order.status === OrderStatus.ESCROW_FUNDED || order.status === OrderStatus.ALLOCATED) {
        // Money is already held: only the operator may unwind it.
        if (!isAdmin) {
          throw new BusinessRuleError(
            "Funds are already held for this order. Raise a dispute to request a refund.",
            ErrorCode.INVALID_STATE_TRANSITION
          );
        }
      } else {
        this.assertTransition(order.status, OrderStatus.CANCELLED);
      }

      await this.applyTransition(tx, order, OrderStatus.CANCELLED, actor, input.reason);
      await this.releaseReservation(tx, order);

      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    });
  }

  /** Seller commits to a loading slot. */
  async allocate(orderId: string, input: AllocateOrderInput, actor: RequestUser) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundError("Order");
      if (!this.isSeller(order, actor) && actor.role !== Role.ADMIN) {
        throw new ForbiddenError("Only the supplying depot can allocate this order");
      }
      this.assertTransition(order.status, OrderStatus.ALLOCATED);

      if (input.loadingDate.getTime() < Date.now() - 86_400_000) {
        throw new ValidationError("The loading date cannot be in the past");
      }

      // Book a truck slot for that day, if the depot manages capacity.
      const depot = await tx.depot.findUniqueOrThrow({ where: { id: order.depotId } });
      if (depot.dailyLoadingCapacity) {
        const slotDate = new Date(input.loadingDate.toISOString().slice(0, 10));
        const slot = await tx.loadingSlot.upsert({
          where: { depotId_slotDate: { depotId: order.depotId, slotDate } },
          create: { depotId: order.depotId, slotDate, capacityTrucks: depot.dailyLoadingCapacity, bookedTrucks: 0 },
          update: {},
        });
        if (slot.bookedTrucks >= slot.capacityTrucks) {
          throw new BusinessRuleError(
            `The depot is fully booked on ${slotDate.toISOString().slice(0, 10)}. Choose another date.`
          );
        }
        // Conditional increment: concurrent allocations cannot overbook.
        const booked = await tx.$executeRaw`
          UPDATE loading_slots
             SET "bookedTrucks" = "bookedTrucks" + 1, "updatedAt" = NOW()
           WHERE id = ${slot.id} AND "bookedTrucks" < "capacityTrucks"
        `;
        if (booked === 0) {
          throw new BusinessRuleError("The last loading slot for that date was just taken");
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { expectedLoadingDate: input.loadingDate },
      });
      await this.applyTransition(tx, order, OrderStatus.ALLOCATED, actor, input.note);

      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    });
  }

  /** Seller records the truck and metered volume; order goes in transit. */
  async dispatch(orderId: string, input: DispatchOrderInput, actor: RequestUser) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundError("Order");
      if (!this.isSeller(order, actor) && actor.role !== Role.ADMIN) {
        throw new ForbiddenError("Only the supplying depot can dispatch this order");
      }
      if (order.status !== OrderStatus.ALLOCATED && order.status !== OrderStatus.LOADING) {
        throw new BusinessRuleError(
          `Cannot dispatch an order in status ${order.status}`,
          ErrorCode.INVALID_STATE_TRANSITION
        );
      }

      const loaded = parseLitres(input.loadedLitres, "Loaded volume");

      // Loading materially more than was sold is an error, not a bonus.
      if (loaded.greaterThan(order.quantityLitres.mul(1.05))) {
        throw new BusinessRuleError(
          `Loaded volume (${loaded.toString()} L) exceeds the ordered volume by more than 5%`
        );
      }

      await tx.delivery.upsert({
        where: { orderId },
        create: {
          orderId,
          truckPlate: input.truckPlate,
          driverName: input.driverName,
          driverPhone: input.driverPhone,
          haulierName: input.haulierName ?? null,
          waybillNumber: input.waybillNumber ?? null,
          loadedLitres: loaded,
          loadedAt: new Date(),
          dispatchedAt: new Date(),
        },
        update: {
          truckPlate: input.truckPlate,
          driverName: input.driverName,
          driverPhone: input.driverPhone,
          haulierName: input.haulierName ?? null,
          waybillNumber: input.waybillNumber ?? null,
          loadedLitres: loaded,
          loadedAt: new Date(),
          dispatchedAt: new Date(),
        },
      });

      // Dispatch spans two real phases: the truck is loaded at the gantry,
      // then it leaves. Both are recorded so the timeline reflects what
      // physically happened rather than collapsing into one jump.
      let current: { id: string; status: OrderStatus; version: number; buyerOrgId: string } = order;
      if (current.status === OrderStatus.ALLOCATED) {
        await this.applyTransition(tx, current, OrderStatus.LOADING, actor, `Loading onto ${input.truckPlate}`);
        current = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
      }
      await this.applyTransition(tx, current, OrderStatus.IN_TRANSIT, actor, `Dispatched on ${input.truckPlate}`);

      return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { delivery: true } });
    });
  }

  /**
   * Buyer confirms receipt and the measured volume.
   *
   * The variance between ordered and received volume is computed and compared
   * against the tolerance. Within tolerance the order completes (escrow
   * release follows in the money layer); beyond it, the order is flagged and
   * held for a dispute rather than auto-completing — a short delivery must
   * never silently pay out in full.
   */
  async confirmDelivery(orderId: string, input: ConfirmDeliveryInput, actor: RequestUser) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { delivery: true } });
      if (!order) throw new NotFoundError("Order");
      if (!this.isBuyer(order, actor) && actor.role !== Role.ADMIN) {
        throw new ForbiddenError("Only the buyer can confirm delivery");
      }
      if (order.status !== OrderStatus.IN_TRANSIT && order.status !== OrderStatus.DELIVERED) {
        throw new BusinessRuleError(
          `Cannot confirm delivery for an order in status ${order.status}`,
          ErrorCode.INVALID_STATE_TRANSITION
        );
      }

      const received = parseLitres(input.receivedLitres, "Received volume");
      const { varianceLitres, flagged } = evaluateDeliveryVariance(
        order.quantityLitres,
        received,
        env.DELIVERY_VARIANCE_TOLERANCE_BPS
      );

      await tx.delivery.upsert({
        where: { orderId },
        create: {
          orderId,
          receivedLitres: received,
          receivedAt: new Date(),
          receivedByName: input.receivedByName,
          varianceLitres,
          varianceFlagged: flagged,
          notes: input.notes ?? null,
        },
        update: {
          receivedLitres: received,
          receivedAt: new Date(),
          receivedByName: input.receivedByName,
          varianceLitres,
          varianceFlagged: flagged,
          notes: input.notes ?? null,
        },
      });

      await this.applyTransition(
        tx,
        order,
        OrderStatus.DELIVERED,
        actor,
        flagged
          ? `Delivered with a variance of ${varianceLitres.toString()} L — outside tolerance, held for review`
          : `Delivered; variance ${varianceLitres.toString()} L within tolerance`
      );

      // Start the auto-complete clock only when the delivery is clean.
      await tx.order.update({
        where: { id: orderId },
        data: {
          autoCompleteAt: flagged
            ? null
            : new Date(Date.now() + env.DELIVERY_AUTO_CONFIRM_HOURS * 3600_000),
        },
      });

      // Consume the reservation: the product has physically left the depot.
      await this.consumeReservation(tx, order);

      return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { delivery: true } });
    });
  }

  /**
   * Completes an order. Escrow release is performed by the money layer; this
   * records the state change and closes the reservation lifecycle.
   */
  async complete(orderId: string, actor: RequestUser, note = "Completed by buyer confirmation") {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { delivery: true } });
      if (!order) throw new NotFoundError("Order");
      if (!this.isBuyer(order, actor) && actor.role !== Role.ADMIN) {
        throw new ForbiddenError("Only the buyer or an operator can complete this order");
      }
      this.assertTransition(order.status, OrderStatus.COMPLETED);

      if (order.delivery?.varianceFlagged && actor.role !== Role.ADMIN) {
        throw new BusinessRuleError(
          "This delivery is outside the agreed tolerance. Resolve the variance before completing."
        );
      }

      await this.applyTransition(tx, order, OrderStatus.COMPLETED, actor, note);
      await tx.order.update({
        where: { id: orderId },
        data: { completedAt: new Date(), autoCompleteAt: null },
      });

      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private assertTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new BusinessRuleError(
        `Cannot move an order from ${from} to ${to}. Allowed: ${allowed.join(", ") || "none (terminal state)"}`,
        ErrorCode.INVALID_STATE_TRANSITION
      );
    }
  }

  /** Writes the status change and its immutable event in one step. */
  private async applyTransition(
    tx: Prisma.TransactionClient,
    order: { id: string; status: OrderStatus; version: number; buyerOrgId: string },
    to: OrderStatus,
    actor: RequestUser,
    note?: string
  ): Promise<void> {
    this.assertTransition(order.status, to);

    // Optimistic lock: a concurrent transition on the same order loses.
    const updated = await tx.order.updateMany({
      where: { id: order.id, version: order.version },
      data: { status: to, version: { increment: 1 } },
    });
    // updateMany returns { count }; a zero count means another request
    // transitioned this order first and our read is stale.
    if (updated.count === 0) throw new ConcurrencyError("Order");

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: to,
        note: note ?? null,
        actorUserId: actor.id,
        actorOrgId: actor.activeOrg?.orgId ?? null,
      },
    });

    await this.audit.record(
      {
        action: `order.${to.toLowerCase()}`,
        entityType: "Order",
        entityId: order.id,
        actorUserId: actor.id,
        actorOrgId: actor.activeOrg?.orgId ?? null,
        changes: { from: order.status, to, note: note ?? null },
      },
      tx
    );
  }

  /** Returns reserved stock to the pool (cancellation). */
  private async releaseReservation(
    tx: Prisma.TransactionClient,
    order: { listingId: string | null; quantityLitres: Prisma.Decimal; status: OrderStatus }
  ): Promise<void> {
    if (!order.listingId || !RESERVING_STATUSES.includes(order.status)) return;
    await tx.$executeRaw`
      UPDATE product_listings
         SET "reservedLitres" = GREATEST("reservedLitres" - ${order.quantityLitres}, 0),
             "updatedAt" = NOW()
       WHERE id = ${order.listingId}
    `;
  }

  /** Removes the volume from both reservation and availability (dispatched). */
  private async consumeReservation(
    tx: Prisma.TransactionClient,
    order: { listingId: string | null; quantityLitres: Prisma.Decimal; status: OrderStatus }
  ): Promise<void> {
    if (!order.listingId || !RESERVING_STATUSES.includes(order.status)) return;
    await tx.$executeRaw`
      UPDATE product_listings
         SET "reservedLitres"  = GREATEST("reservedLitres"  - ${order.quantityLitres}, 0),
             "availableLitres" = GREATEST("availableLitres" - ${order.quantityLitres}, 0),
             "updatedAt" = NOW()
       WHERE id = ${order.listingId}
    `;
  }

  /** Most specific active fee policy for a product, else the env default. */
  private async resolveFeePolicy(tx: Prisma.TransactionClient, product: string) {
    const now = new Date();
    const policy = await tx.feePolicy.findFirst({
      where: {
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
        AND: [{ OR: [{ product: product as never }, { product: null }] }],
      },
      // A product-specific policy outranks the catch-all.
      orderBy: [{ product: { sort: "asc", nulls: "last" } }, { effectiveFrom: "desc" }],
    });

    return policy
      ? {
          bps: policy.bps,
          flatKobo: policy.flatKobo,
          minFeeKobo: policy.minFeeKobo,
          maxFeeKobo: policy.maxFeeKobo,
        }
      : { bps: env.DEFAULT_FEE_BPS };
  }

  private isBuyer(order: { buyerOrgId: string }, actor: RequestUser): boolean {
    return actor.organizations.some((o) => o.orgId === order.buyerOrgId);
  }

  private isSeller(order: { sellerOrgId: string }, actor: RequestUser): boolean {
    return actor.organizations.some((o) => o.orgId === order.sellerOrgId);
  }

  private assertParty(order: { buyerOrgId: string; sellerOrgId: string }, actor: RequestUser): void {
    if (actor.role === Role.ADMIN) return;
    if (!this.isBuyer(order, actor) && !this.isSeller(order, actor)) {
      // Do not disclose that the order exists.
      throw new NotFoundError("Order");
    }
  }

  private generateRef(): string {
    const year = new Date().getFullYear();
    return `FL-${year}-${randomBytes(4).toString("hex").toUpperCase()}`;
  }
}
