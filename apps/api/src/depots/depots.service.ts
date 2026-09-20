import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDepotInput, ListDepotsQuery, UpdateDepotInput } from "./dto";

export interface Actor {
  id: string;
  role: Role;
}

@Injectable()
export class DepotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actor: Actor, input: CreateDepotInput) {
    const slug = await this.uniqueSlug(input.name);
    return this.prisma.depot.create({
      data: {
        ownerId: actor.id,
        name: input.name,
        slug,
        state: input.state,
        lga: input.lga ?? null,
        address: input.address ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        capacityKL: input.capacityKL ?? null,
        fuelTypes: input.fuelTypes,
        gantryActive: input.gantryActive,
        nnpcLicenseNo: input.nnpcLicenseNo ?? null,
        notes: input.notes ?? null
      }
    });
  }

  /** Public registry — active depots only. */
  async list(query: ListDepotsQuery) {
    const where: Prisma.DepotWhereInput = {
      isActive: true,
      state: query.state ?? undefined,
      ...(query.fuelType ? { fuelTypes: { has: query.fuelType } } : {})
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.depot.count({ where }),
      this.prisma.depot.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      })
    ]);
    return { data, page: query.page, pageSize: query.pageSize, total };
  }

  /** Public lookup by id. */
  async getPublic(id: string) {
    const depot = await this.prisma.depot.findUnique({ where: { id } });
    if (!depot || !depot.isActive) throw new NotFoundException("Depot not found");
    return depot;
  }

  async update(actor: Actor, id: string, input: UpdateDepotInput) {
    const depot = await this.getOwnedOrAdmin(actor, id);
    return this.prisma.depot.update({
      where: { id: depot.id },
      data: {
        name: input.name,
        state: input.state,
        lga: input.lga,
        address: input.address,
        lat: input.lat,
        lng: input.lng,
        capacityKL: input.capacityKL,
        fuelTypes: input.fuelTypes,
        gantryActive: input.gantryActive,
        nnpcLicenseNo: input.nnpcLicenseNo,
        notes: input.notes
      }
    });
  }

  /** Soft delete — the registry keeps history; orders survive (onDelete: Restrict). */
  async deactivate(actor: Actor, id: string) {
    const depot = await this.getOwnedOrAdmin(actor, id);
    return this.prisma.depot.update({
      where: { id: depot.id },
      data: { isActive: false }
    });
  }

  private async getOwnedOrAdmin(actor: Actor, id: string) {
    const depot = await this.prisma.depot.findUnique({ where: { id } });
    if (!depot || !depot.isActive) throw new NotFoundException("Depot not found");
    const isOwner = depot.ownerId === actor.id;
    const isAdmin = actor.role === Role.ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException("You do not manage this depot");
    return depot;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || "depot";
    let slug = base;
    let n = 2;
    for (;;) {
      try {
        const existing = await this.prisma.depot.findUnique({ where: { slug } });
        if (!existing) return slug;
      } catch (err) {
        // Constraint race on concurrent creation — retry with a fresh suffix.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") return slug;
        throw err;
      }
      slug = `${base}-${n++}`;
    }
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
