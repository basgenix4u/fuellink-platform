import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictError, ErrorCode, ValidationError } from "./errors";

/**
 * Idempotent execution of unsafe operations.
 *
 * Nigerian mobile networks retry aggressively; a duplicated POST must not
 * create two orders or two payments. Clients send an `Idempotency-Key`
 * header; the first request executes and its response is stored, and any
 * retry with the same key replays that stored response.
 *
 * Concurrency is handled by inserting the key row *before* doing the work:
 * the unique index makes a simultaneous duplicate fail fast rather than both
 * proceeding.
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  /** How long a key is honoured before it may be reused. */
  private static readonly TTL_HOURS = 24;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes `work` at most once for a given (key, user, endpoint) triple.
   *
   * @throws ConflictError when the same key is replayed with a different body,
   *         or while the original request is still in flight.
   */
  async execute<T>(params: {
    key: string | undefined;
    userId: string | null;
    endpoint: string;
    requestBody: unknown;
    work: () => Promise<T>;
  }): Promise<T> {
    const { key, userId, endpoint, requestBody, work } = params;

    // No key supplied: execute normally. Endpoints that *require* a key
    // enforce that separately at the controller boundary.
    if (!key) return work();

    if (key.length < 8 || key.length > 255) {
      throw new ValidationError("Idempotency-Key must be between 8 and 255 characters");
    }

    const requestHash = this.hash(requestBody);
    const expiresAt = new Date(Date.now() + IdempotencyService.TTL_HOURS * 3600_000);

    // Claim the key. Unique index = only one winner under concurrency.
    try {
      await this.prisma.idempotencyKey.create({
        data: { key, userId, endpoint, requestHash, expiresAt },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return this.replay<T>({ key, userId, endpoint, requestHash });
      }
      throw err;
    }

    // We own the key: run the work and persist the outcome.
    try {
      const result = await work();
      await this.prisma.idempotencyKey.updateMany({
        where: { key, userId, endpoint },
        data: {
          statusCode: 200,
          responseBody: this.toJson(result),
          completedAt: new Date(),
        },
      });
      return result;
    } catch (err) {
      // Failures release the key so the caller may legitimately retry.
      await this.prisma.idempotencyKey
        .deleteMany({ where: { key, userId, endpoint } })
        .catch((cleanupErr: unknown) =>
          this.logger.error({ err: cleanupErr, key, endpoint }, "Failed to release idempotency key")
        );
      throw err;
    }
  }

  private async replay<T>(params: {
    key: string;
    userId: string | null;
    endpoint: string;
    requestHash: string;
  }): Promise<T> {
    const existing = await this.prisma.idempotencyKey.findFirst({
      where: { key: params.key, userId: params.userId, endpoint: params.endpoint },
    });

    if (!existing) {
      // Expired and swept between the insert failure and this read.
      throw new ConflictError(
        "This request could not be replayed. Retry with a new Idempotency-Key.",
        ErrorCode.CONFLICT
      );
    }

    // Same key, different payload: almost always a client bug. Refuse.
    if (existing.requestHash !== params.requestHash) {
      throw new ConflictError(
        "This Idempotency-Key was already used with a different request body",
        ErrorCode.IDEMPOTENCY_KEY_REUSED
      );
    }

    if (!existing.completedAt) {
      throw new ConflictError(
        "An identical request is currently being processed. Retry shortly.",
        ErrorCode.REQUEST_IN_FLIGHT
      );
    }

    return existing.responseBody as T;
  }

  /** Removes expired keys. Invoked by the maintenance schedule. */
  async sweepExpired(): Promise<number> {
    const { count } = await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) this.logger.log(`Swept ${count} expired idempotency keys`);
    return count;
  }

  private hash(body: unknown): string {
    return createHash("sha256").update(JSON.stringify(this.toJson(body) ?? null)).digest("hex");
  }

  /** BigInt/Date/Decimal are not JSON-serialisable. */
  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(
      JSON.stringify(value, (_k, v) => {
        if (typeof v === "bigint") return v.toString();
        if (v instanceof Date) return v.toISOString();
        if (v && typeof v === "object" && "toFixed" in v && typeof v.toFixed === "function") return String(v);
        return v;
      })
    ) as Prisma.InputJsonValue;
  }
}
