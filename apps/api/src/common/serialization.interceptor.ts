import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Observable, map } from "rxjs";

/**
 * Normalises values that JSON cannot represent safely:
 *  - BigInt (kobo)        -> decimal string, exact
 *  - Prisma.Decimal       -> decimal string, exact (never a float)
 *  - Date                 -> ISO-8601 string
 *
 * Applied globally so no controller can accidentally emit a lossy number.
 */
function normalize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Buffer.isBuffer(value)) return value.toString("base64");

  if (Array.isArray(value)) return value.map((v) => normalize(v, seen));

  if (typeof value === "object") {
    // Guard against cycles rather than blowing the stack.
    if (seen.has(value as object)) return undefined;
    seen.add(value as object);

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalize(v, seen);
    }
    return out;
  }

  return value;
}

@Injectable()
export class SerializationInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => normalize(data)));
  }
}
