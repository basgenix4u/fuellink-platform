import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { EscrowStatus, Prisma, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { Actor } from "../depots/depots.service";
import { CreateEscrowInput, ListEscrowQuery, TransitionEscrowInput } from "./dto";

/**
 * Escrow state machine — bank-held escrow (Providus).
 *
 *   DRAFT → PENDING_PAYMENT → BANK_HELD → RELEASED
 *      │            │              │            (DISPUTED ← BANK_HELD, → RELEASED | CANCELLED)
 *      └── CANCELLED └── CANCELLED
 *
 * BANK_HELD means the buyer's funds sit with the bank (Providus), not with
 * FuelLink or the supplier. The bank creates the hold; we record its
 * reference. RELEASED only fires on delivery confirmation — that confirmation
 * flow (buyer receipt + optional 48h auto-release) ships with the web orders
 * UI; until then, RELEASED transitions are admin-only.
 *
 * PROVIDUS INTEGRATION (blocked on bank API access + legal structure):
 *   1. PENDING_PAYMENT: buyer pays → call Providus to create the bank hold.
 *   2. Webhook from Providus confirms the hold → set BANK_HELD + bankRef.
 *   3. RELEASED: call Providus to release to the supplier's account.
 *   4. DISPUTED: call Providus to freeze; admin resolves.
 */
const ALLOWED_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  [EscrowStatus.DRAFT]: [EscrowStatus.PENDING_PAYMENT, EscrowStatus.CANCELLED],
  [EscrowStatus.PENDING_PAYMENT]: [EscrowStatus.BANK_HELD, EscrowStatus.CANCELLED],
  [EscrowStatus.BANK_HELD]: [EscrowStatus.RELEASED, EscrowStatus.DISPUTED],
  [EscrowStatus.DISPUTED]: [EscrowStatus.RELEASED, EscrowStatus.CANCELLED],
  [EscrowStatus.RELEASED]: [],
  [EscrowStatus.CANCELLED]: []
};

@Injectable()
export class EscrowService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actor: Actor, input: CreateEscrowInput) {
    const depot = await this.prisma.depot.findUnique({ where: { id: input.depotId } });
    if (!depot || !depot.isActive) throw new NotFoundException("Depot not found");

    const totalKobo = BigInt(Math.round(input.quantityLiters)) * BigInt(input.unitPriceKobo);
    const order = await this.prisma.escrowOrder.create({
      data: {
        ref: this.generateRef(),
        buyerId: actor.id,
        depotId: depot.id,
        fuelType: input.fuelType,
        quantityLiters: input.quantityLiters,
        unitPriceKobo: BigInt(input.unitPriceKobo),
        totalKobo
      }
    });
    return this.prisma.escrowOrder.update({
      where: { id: order.id },
      data: { status: EscrowStatus.PENDING_PAYMENT }
    });
  }

  async list(actor: Actor, query: ListEscrowQuery) {
    const where: Prisma.EscrowOrderWhereInput = { status: query.status ?? undefined };
    if (actor.role === Role.MARKETER) {
      where.buyerId = actor.id;
    } else if (actor.role === Role.DEPOT) {
      const depots = await this.prisma.depot.findMany({
        where: { ownerId: actor.id },
        select: { id: true }
      });
      where.depotId = { in: depots.map((d) => d.id) };
    }
    // ADMIN: unfiltered.

    const [total, data] = await this.prisma.$transaction([
      this.prisma.escrowOrder.count({ where }),
      this.prisma.escrowOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      })
    ]);
    return { data, page: query.page, pageSize: query.pageSize, total };
  }

  async get(actor: Actor, id: string) {
    const order = await this.prisma.escrowOrder.findUnique({
      where: { id },
      include: { depot: { select: { ownerId: true } } }
    });
    if (!order) throw new NotFoundException("Order not found");
    this.ensureCanView(actor, order);
    return order;
  }

  async transition(actor: Actor, id: string, input: TransitionEscrowInput) {
    const order = await this.prisma.escrowOrder.findUnique({
      where: { id },
      include: { depot: { select: { ownerId: true } } }
    });
    if (!order) throw new NotFoundException("Order not found");

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(input.status)) {
      throw new BadRequestException(
        `Cannot move ${order.status} → ${input.status}. Allowed from ${order.status}: ${allowed.length ? allowed.join(", ") : "none (terminal state)"}`
      );
    }

    const isBuyer = order.buyerId === actor.id;
    const isDepot = order.depot.ownerId === actor.id;
    const isAdmin = actor.role === Role.ADMIN;

    switch (input.status) {
      case EscrowStatus.PENDING_PAYMENT:
      case EscrowStatus.CANCELLED:
        if (!isBuyer && !isAdmin) throw new ForbiddenException("Only the buyer or an admin can do this");
        break;
      case EscrowStatus.BANK_HELD:
        if (!isAdmin) throw new ForbiddenException("Bank-hold confirmation is operator-only until the Providus webhook lands");
        if (!input.bankRef) throw new BadRequestException("bankRef (Providus hold reference) is required for BANK_HELD");
        break;
      case EscrowStatus.DISPUTED:
        if (!isBuyer && !isDepot && !isAdmin) throw new ForbiddenException("Only the buyer, the supplier, or an admin can open a dispute");
        break;
      case EscrowStatus.RELEASED:
        // Until the delivery-confirmation flow ships, release is admin-only
        // (the bank releases funds on this instruction).
        if (!isAdmin) throw new ForbiddenException("Release is operator-only until the delivery-confirmation flow lands");
        break;
    }

    return this.prisma.escrowOrder.update({
      where: { id: order.id },
      data: {
        status: input.status,
        statusNote: input.statusNote ?? order.statusNote,
        bankRef: input.status === EscrowStatus.BANK_HELD ? (input.bankRef ?? null) : order.bankRef
      }
    });
  }

  private ensureCanView(actor: Actor, order: { buyerId: string; depot: { ownerId: string } | null }) {
    const isAdmin = actor.role === Role.ADMIN;
    const isBuyer = order.buyerId === actor.id;
    const isDepot = order.depot?.ownerId === actor.id;
    if (!isAdmin && !isBuyer && !isDepot) {
      throw new ForbiddenException("You do not have access to this order");
    }
  }

  private generateRef(): string {
    return `FL-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  }
}
