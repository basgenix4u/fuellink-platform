import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditInput {
  action: string;
  entityType: string;
  entityId: string;
  actorUserId?: string | null;
  actorOrgId?: string | null;
  changes?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

/** Field names that must never be persisted to the audit trail. */
const REDACTED_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "refreshtoken",
  "accesstoken",
  "secret",
  "apikey",
  "authorization",
  "cookie",
  "bvn",
  "nin",
]);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an audit entry.
   *
   * Two modes:
   *  - pass a transaction client (`tx`) to make the audit atomic with the
   *    business write (preferred for money and status changes);
   *  - call without `tx` for best-effort logging outside a transaction.
   *
   * A failure to write an audit row must never break the user's request, so
   * the non-transactional path swallows and logs errors.
   */
  async record(input: AuditInput, tx?: Prisma.TransactionClient): Promise<void> {
    const data = {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorUserId: input.actorUserId ?? null,
      actorOrgId: input.actorOrgId ?? null,
      changes: input.changes === undefined ? undefined : (this.redact(input.changes) as Prisma.InputJsonValue),
      ip: input.ip ?? null,
      userAgent: input.userAgent?.slice(0, 500) ?? null,
    };

    if (tx) {
      await tx.auditLog.create({ data });
      return;
    }

    try {
      await this.prisma.auditLog.create({ data });
    } catch (err) {
      this.logger.error(
        { err, action: input.action, entityType: input.entityType, entityId: input.entityId },
        "Failed to write audit log"
      );
    }
  }

  /** Builds a before/after diff containing only the fields that changed. */
  diff<T extends Record<string, unknown>>(before: T, after: Partial<T>): Prisma.InputJsonValue {
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, next] of Object.entries(after)) {
      const prev = before[key];
      if (!Object.is(this.normalize(prev), this.normalize(next))) {
        changed[key] = { from: this.normalize(prev), to: this.normalize(next) };
      }
    }
    return this.redact(changed) as Prisma.InputJsonValue;
  }

  /** BigInt/Date/Decimal are not JSON-serialisable; normalise for storage. */
  private normalize(value: unknown): unknown {
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (value && typeof value === "object" && "toFixed" in value && typeof value.toFixed === "function") {
      return String(value);
    }
    return value;
  }

  private redact(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((v) => this.redact(v));
    if (typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = REDACTED_KEYS.has(k.toLowerCase()) ? "[redacted]" : this.redact(v);
      }
      return out;
    }
    return value;
  }
}
