import { Injectable } from "@nestjs/common";
import { Prisma, Role, VerificationStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import {
  BusinessRuleError,
  ConcurrencyError,
  ErrorCode,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../common/errors";
import { nairaToKobo, parseLitres } from "../common/money";
import type { RequestUser } from "../auth/request.types";
import {
  CreateDepotInput,
  CreateListingInput,
  CreateTankInput,
  ListDepotsQuery,
  ListListingsQuery,
  UpdateDepotInput,
  UpdateListingInput,
  UpdateTankLevelInput,
} from "./dto";

/** Longest a price may stand before it must be re-confirmed. */
const MAX_LISTING_VALIDITY_DAYS = 30;
const DEFAULT_LISTING_VALIDITY_HOURS = 24;

@Injectable()
export class DepotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  // -------------------------------------------------------------------------
  // Depots
  // -------------------------------------------------------------------------

  async create(orgId: string, input: CreateDepotInput, actor: RequestUser) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundError("Organisation");
    if (org.type !== "DEPOT") {
      throw new BusinessRuleError("Only depot organisations can register depots");
    }

    const depot = await this.prisma.depot.create({
      data: {
        orgId,
        name: input.name,
        slug: await this.uniqueSlug(input.name),
        state: input.state,
        lga: input.lga ?? null,
        address: input.address ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        capacityLitres: input.capacityLitres ? new Prisma.Decimal(input.capacityLitres) : null,
        gantryActive: input.gantryActive,
        dailyLoadingCapacity: input.dailyLoadingCapacity ?? null,
        operatingHours: input.operatingHours ?? null,
        contactPhone: input.contactPhone ?? null,
        notes: input.notes ?? null,
      },
    });

    await this.audit.record({
      action: "depot.created",
      entityType: "Depot",
      entityId: depot.id,
      actorUserId: actor.id,
      actorOrgId: orgId,
      changes: { name: depot.name, state: depot.state },
    });

    return depot;
  }

  /**
   * Public depot directory.
   *
   * Only depots belonging to VERIFIED organisations are listed — an unvetted
   * depot must not be discoverable, because discoverability is an implicit
   * endorsement.
   */
  async listPublic(query: ListDepotsQuery) {
    const now = new Date();
    const where: Prisma.DepotWhereInput = {
      isActive: true,
      org: { verificationStatus: VerificationStatus.VERIFIED, isActive: true },
      state: query.state,
      ...(query.search
        ? { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(query.product || query.hasStock
        ? {
            listings: {
              some: {
                isActive: true,
                validUntil: { gt: now },
                availableLitres: { gt: 0 },
                ...(query.product ? { product: query.product } : {}),
              },
            },
          }
        : {}),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.depot.count({ where }),
      this.prisma.depot.findMany({
        where,
        include: {
          org: { select: { id: true, name: true, verificationStatus: true, verifiedAt: true } },
          listings: {
            where: { isActive: true, validUntil: { gt: now }, availableLitres: { gt: 0 } },
            select: {
              id: true,
              product: true,
              pricePerLitreKobo: true,
              availableLitres: true,
              reservedLitres: true,
              minOrderLitres: true,
              validUntil: true,
            },
            orderBy: { pricePerLitreKobo: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      data: data.map((d) => ({ ...d, listings: d.listings.map((l) => this.decorateListing(l)) })),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async getPublic(idOrSlug: string) {
    const now = new Date();
    const depot = await this.prisma.depot.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
        org: { verificationStatus: VerificationStatus.VERIFIED, isActive: true },
      },
      include: {
        org: { select: { id: true, name: true, verificationStatus: true, verifiedAt: true } },
        listings: {
          where: { isActive: true, validUntil: { gt: now } },
          orderBy: { pricePerLitreKobo: "asc" },
        },
        tanks: { where: { isActive: true }, select: { id: true, name: true, product: true } },
      },
    });
    if (!depot) throw new NotFoundError("Depot");

    return { ...depot, listings: depot.listings.map((l) => this.decorateListing(l)) };
  }

  /** Depots owned by the caller's organisation, including inactive ones. */
  async listOwn(orgId: string) {
    return this.prisma.depot.findMany({
      where: { orgId },
      include: {
        tanks: { where: { isActive: true } },
        _count: { select: { listings: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(depotId: string, input: UpdateDepotInput, actor: RequestUser) {
    const depot = await this.assertManageable(depotId, actor);

    const updated = await this.prisma.depot.update({
      where: { id: depotId },
      data: {
        ...input,
        capacityLitres:
          input.capacityLitres === undefined ? undefined : new Prisma.Decimal(input.capacityLitres),
      },
    });

    await this.audit.record({
      action: "depot.updated",
      entityType: "Depot",
      entityId: depotId,
      actorUserId: actor.id,
      actorOrgId: depot.orgId,
      changes: this.audit.diff(depot as unknown as Record<string, unknown>, input),
    });

    return updated;
  }

  /**
   * Deactivates a depot. Listings are withdrawn at the same time so no new
   * orders can reference them; existing orders are unaffected and must still
   * be fulfilled.
   */
  async deactivate(depotId: string, actor: RequestUser) {
    const depot = await this.assertManageable(depotId, actor);

    const openOrders = await this.prisma.order.count({
      where: {
        depotId,
        status: { in: ["AWAITING_PAYMENT", "ESCROW_FUNDED", "ALLOCATED", "LOADING", "IN_TRANSIT", "DELIVERED"] },
      },
    });
    if (openOrders > 0) {
      throw new BusinessRuleError(
        `This depot has ${openOrders} order(s) in progress. Complete or cancel them before deactivating.`
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.depot.update({ where: { id: depotId }, data: { isActive: false } });
      await tx.productListing.updateMany({ where: { depotId }, data: { isActive: false } });
    });

    await this.audit.record({
      action: "depot.deactivated",
      entityType: "Depot",
      entityId: depotId,
      actorUserId: actor.id,
      actorOrgId: depot.orgId,
    });
  }

  // -------------------------------------------------------------------------
  // Tanks
  // -------------------------------------------------------------------------

  async addTank(depotId: string, input: CreateTankInput, actor: RequestUser) {
    const depot = await this.assertManageable(depotId, actor);

    if (input.currentLitres > input.capacityLitres) {
      throw new ValidationError("Current level cannot exceed the tank's capacity");
    }

    const tank = await this.prisma.tank.create({
      data: {
        depotId,
        name: input.name,
        product: input.product,
        capacityLitres: new Prisma.Decimal(input.capacityLitres),
        currentLitres: new Prisma.Decimal(input.currentLitres),
        lastDipAt: input.currentLitres > 0 ? new Date() : null,
      },
    });

    await this.audit.record({
      action: "tank.created",
      entityType: "Tank",
      entityId: tank.id,
      actorUserId: actor.id,
      actorOrgId: depot.orgId,
      changes: { depotId, name: input.name, product: input.product },
    });

    return tank;
  }

  async updateTankLevel(tankId: string, input: UpdateTankLevelInput, actor: RequestUser) {
    const tank = await this.prisma.tank.findUnique({ where: { id: tankId }, include: { depot: true } });
    if (!tank) throw new NotFoundError("Tank");
    await this.assertManageable(tank.depotId, actor);

    if (new Prisma.Decimal(input.currentLitres).greaterThan(tank.capacityLitres)) {
      throw new ValidationError("Level cannot exceed the tank's capacity");
    }

    const updated = await this.prisma.tank.update({
      where: { id: tankId },
      data: {
        currentLitres: new Prisma.Decimal(input.currentLitres),
        lastDipAt: input.dipAt ?? new Date(),
      },
    });

    await this.audit.record({
      action: "tank.level_updated",
      entityType: "Tank",
      entityId: tankId,
      actorUserId: actor.id,
      actorOrgId: tank.depot.orgId,
      changes: { from: tank.currentLitres.toString(), to: input.currentLitres.toString() },
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // Listings
  // -------------------------------------------------------------------------

  async createListing(input: CreateListingInput, actor: RequestUser) {
    const depot = await this.assertManageable(input.depotId, actor);

    const org = await this.prisma.organization.findUnique({ where: { id: depot.orgId } });
    if (org?.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenError(
        "Your organisation must be verified before you can list product",
        ErrorCode.ORG_NOT_VERIFIED
      );
    }

    const validUntil = input.validUntil ?? new Date(Date.now() + DEFAULT_LISTING_VALIDITY_HOURS * 3600_000);
    this.assertValidityWindow(validUntil);

    const available = parseLitres(input.availableLitres, "Available volume");
    const minOrder = new Prisma.Decimal(input.minOrderLitres);

    if (minOrder.greaterThan(available)) {
      throw new ValidationError("Minimum order cannot exceed the available volume");
    }
    if (input.maxOrderLitres !== undefined && input.maxOrderLitres < input.minOrderLitres) {
      throw new ValidationError("Maximum order cannot be less than the minimum order");
    }

    const listing = await this.prisma.$transaction(async (tx) => {
      const created = await tx.productListing.create({
        data: {
          depotId: input.depotId,
          product: input.product,
          pricePerLitreKobo: nairaToKobo(input.pricePerLitreNaira),
          availableLitres: available,
          minOrderLitres: minOrder,
          maxOrderLitres: input.maxOrderLitres ? new Prisma.Decimal(input.maxOrderLitres) : null,
          validUntil,
        },
      });

      // Price history starts at creation so a buyer can always see how a
      // price moved — this is evidence in a pricing dispute.
      await tx.priceHistory.create({
        data: {
          listingId: created.id,
          pricePerLitreKobo: created.pricePerLitreKobo,
          availableLitres: created.availableLitres,
          changedById: actor.id,
        },
      });

      return created;
    });

    await this.audit.record({
      action: "listing.created",
      entityType: "ProductListing",
      entityId: listing.id,
      actorUserId: actor.id,
      actorOrgId: depot.orgId,
      changes: {
        product: input.product,
        pricePerLitreKobo: listing.pricePerLitreKobo.toString(),
        availableLitres: listing.availableLitres.toString(),
      },
    });

    return this.decorateListing(listing);
  }

  /**
   * Updates a listing under optimistic locking.
   *
   * Two staff editing the same price concurrently must not silently overwrite
   * each other, and stock may not be reduced below what is already reserved
   * for confirmed orders.
   */
  async updateListing(listingId: string, input: UpdateListingInput, actor: RequestUser) {
    const listing = await this.prisma.productListing.findUnique({
      where: { id: listingId },
      include: { depot: true },
    });
    if (!listing) throw new NotFoundError("Listing");
    await this.assertManageable(listing.depotId, actor);

    if (input.version !== undefined && input.version !== listing.version) {
      throw new ConcurrencyError("Listing");
    }
    if (input.validUntil) this.assertValidityWindow(input.validUntil);

    if (input.availableLitres !== undefined) {
      const next = new Prisma.Decimal(input.availableLitres);
      if (next.lessThan(listing.reservedLitres)) {
        throw new BusinessRuleError(
          `Cannot reduce availability below the ${listing.reservedLitres.toString()} L already reserved for confirmed orders`,
          ErrorCode.INSUFFICIENT_INVENTORY
        );
      }
    }

    const data: Prisma.ProductListingUpdateInput = {
      version: { increment: 1 },
      ...(input.pricePerLitreNaira !== undefined
        ? { pricePerLitreKobo: nairaToKobo(input.pricePerLitreNaira) }
        : {}),
      ...(input.availableLitres !== undefined
        ? { availableLitres: new Prisma.Decimal(input.availableLitres) }
        : {}),
      ...(input.minOrderLitres !== undefined
        ? { minOrderLitres: new Prisma.Decimal(input.minOrderLitres) }
        : {}),
      ...(input.maxOrderLitres !== undefined
        ? { maxOrderLitres: input.maxOrderLitres === null ? null : new Prisma.Decimal(input.maxOrderLitres) }
        : {}),
      ...(input.validUntil !== undefined ? { validUntil: input.validUntil } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      // Guard on the version we read: a concurrent writer loses the race.
      const result = await tx.productListing.updateMany({
        where: { id: listingId, version: listing.version },
        data,
      });
      if (result.count === 0) throw new ConcurrencyError("Listing");

      const fresh = await tx.productListing.findUniqueOrThrow({ where: { id: listingId } });

      const priceChanged = fresh.pricePerLitreKobo !== listing.pricePerLitreKobo;
      const volumeChanged = !fresh.availableLitres.equals(listing.availableLitres);
      if (priceChanged || volumeChanged) {
        await tx.priceHistory.create({
          data: {
            listingId,
            pricePerLitreKobo: fresh.pricePerLitreKobo,
            availableLitres: fresh.availableLitres,
            changedById: actor.id,
          },
        });
      }

      return fresh;
    });

    await this.audit.record({
      action: "listing.updated",
      entityType: "ProductListing",
      entityId: listingId,
      actorUserId: actor.id,
      actorOrgId: listing.depot.orgId,
      changes: {
        priceFrom: listing.pricePerLitreKobo.toString(),
        priceTo: updated.pricePerLitreKobo.toString(),
        volumeFrom: listing.availableLitres.toString(),
        volumeTo: updated.availableLitres.toString(),
      },
    });

    return this.decorateListing(updated);
  }

  /** Public marketplace search. Expired listings are excluded by default. */
  async listListings(query: ListListingsQuery) {
    const now = new Date();
    const where: Prisma.ProductListingWhereInput = {
      product: query.product,
      depotId: query.depotId,
      depot: {
        isActive: true,
        state: query.state,
        org: { verificationStatus: VerificationStatus.VERIFIED, isActive: true },
      },
      ...(query.includeExpired ? {} : { isActive: true, validUntil: { gt: now }, availableLitres: { gt: 0 } }),
      ...(query.minLitres ? { availableLitres: { gte: new Prisma.Decimal(query.minLitres) } } : {}),
    };

    const orderBy: Prisma.ProductListingOrderByWithRelationInput =
      query.sort === "price_desc"
        ? { pricePerLitreKobo: "desc" }
        : query.sort === "newest"
          ? { createdAt: "desc" }
          : query.sort === "volume_desc"
            ? { availableLitres: "desc" }
            : { pricePerLitreKobo: "asc" };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.productListing.count({ where }),
      this.prisma.productListing.findMany({
        where,
        include: {
          depot: {
            select: {
              id: true,
              name: true,
              slug: true,
              state: true,
              lga: true,
              gantryActive: true,
              org: { select: { id: true, name: true, verifiedAt: true } },
            },
          },
        },
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      data: data.map((l) => this.decorateListing(l)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async getListing(listingId: string) {
    const listing = await this.prisma.productListing.findUnique({
      where: { id: listingId },
      include: {
        depot: { include: { org: { select: { id: true, name: true, verifiedAt: true } } } },
        history: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!listing) throw new NotFoundError("Listing");
    return this.decorateListing(listing);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Adds derived, client-facing fields. `sellableLitres` is what a buyer can
   * actually order: availability minus what is already reserved.
   */
  private decorateListing<
    T extends {
      availableLitres: Prisma.Decimal;
      reservedLitres?: Prisma.Decimal;
      validUntil?: Date;
      isActive?: boolean;
    },
  >(listing: T) {
    const reserved = listing.reservedLitres ?? new Prisma.Decimal(0);
    const sellable = listing.availableLitres.minus(reserved);
    const expired = listing.validUntil ? listing.validUntil.getTime() <= Date.now() : false;
    return {
      ...listing,
      sellableLitres: sellable.lessThan(0) ? new Prisma.Decimal(0) : sellable,
      isExpired: expired,
      isOrderable: !expired && listing.isActive !== false && sellable.greaterThan(0),
    };
  }

  private assertValidityWindow(validUntil: Date): void {
    const now = Date.now();
    if (validUntil.getTime() <= now) {
      throw new ValidationError("The validity date must be in the future");
    }
    if (validUntil.getTime() > now + MAX_LISTING_VALIDITY_DAYS * 86_400_000) {
      throw new ValidationError(
        `A price may stand for at most ${MAX_LISTING_VALIDITY_DAYS} days. Re-confirm it after that.`
      );
    }
  }

  /** Confirms the caller may manage this depot, and returns it. */
  private async assertManageable(depotId: string, actor: RequestUser) {
    const depot = await this.prisma.depot.findUnique({ where: { id: depotId } });
    if (!depot) throw new NotFoundError("Depot");

    if (actor.role === Role.ADMIN) return depot;

    const member = actor.organizations.find((o) => o.orgId === depot.orgId);
    if (!member) throw new NotFoundError("Depot"); // Do not confirm existence to outsiders.

    if (!["OWNER", "MANAGER", "STAFF"].includes(member.orgRole)) {
      throw new ForbiddenError(
        "Your role in this organisation cannot manage depots",
        ErrorCode.INSUFFICIENT_ORG_ROLE
      );
    }
    return depot;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "depot";

    for (let attempt = 0; attempt < 50; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const existing = await this.prisma.depot.findUnique({ where: { slug }, select: { id: true } });
      if (!existing) return slug;
    }
    return `${base}-${randomBytes(4).toString("hex")}`;
  }
}
