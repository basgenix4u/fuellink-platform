import { Prisma } from "@prisma/client";
import { ValidationError } from "./errors";

/**
 * Money and volume primitives.
 *
 * Money is **kobo** as BigInt. Volume is **litres** as Prisma.Decimal with
 * 3 decimal places (millilitre precision). Neither is ever a JS number in a
 * calculation that reaches the database — floats silently lose money.
 */

export const KOBO_PER_NAIRA = 100n;

/** Largest order we will accept, as a sanity bound (₦100bn). */
const MAX_KOBO = 10_000_000_000_000n;

export function nairaToKobo(naira: number | string): bigint {
  const s = typeof naira === "number" ? naira.toFixed(2) : naira.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) {
    throw new ValidationError(`Invalid naira amount: ${naira}. Use at most 2 decimal places.`);
  }
  const negative = s.startsWith("-");
  const [whole, frac = ""] = (negative ? s.slice(1) : s).split(".");
  const kobo = BigInt(whole) * KOBO_PER_NAIRA + BigInt(frac.padEnd(2, "0"));
  return negative ? -kobo : kobo;
}

/** Formats kobo as a plain decimal naira string, e.g. 114050n -> "1140.50". */
export function koboToNairaString(kobo: bigint): string {
  const negative = kobo < 0n;
  const abs = negative ? -kobo : kobo;
  const whole = abs / KOBO_PER_NAIRA;
  const frac = abs % KOBO_PER_NAIRA;
  return `${negative ? "-" : ""}${whole}.${frac.toString().padStart(2, "0")}`;
}

export function assertSaneKobo(value: bigint, label = "amount"): void {
  if (value < 0n) throw new ValidationError(`${label} cannot be negative`);
  if (value > MAX_KOBO) throw new ValidationError(`${label} exceeds the maximum permitted value`);
}

/**
 * Order subtotal = litres × price-per-litre, rounded half-up to whole kobo.
 *
 * Implemented in integer arithmetic: litres carry 3 decimals, so we scale by
 * 1000, multiply, then divide with explicit rounding. No float involved.
 */
export function computeSubtotalKobo(litres: Prisma.Decimal, pricePerLitreKobo: bigint): bigint {
  if (litres.lessThanOrEqualTo(0)) throw new ValidationError("Quantity must be greater than zero");
  if (pricePerLitreKobo <= 0n) throw new ValidationError("Price must be greater than zero");

  // litres has at most 3dp (enforced by the column type); scale to an integer.
  const milliLitres = BigInt(litres.mul(1000).toFixed(0));
  const scaled = milliLitres * pricePerLitreKobo; // kobo × 1000
  const subtotal = divideRoundHalfUp(scaled, 1000n);

  assertSaneKobo(subtotal, "Order subtotal");
  return subtotal;
}

/** Integer division rounding half away from zero. */
export function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new ValidationError("Division by zero");
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const quotient = n / d;
  const remainder = n % d;
  const rounded = remainder * 2n >= d ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

/**
 * Platform commission from a basis-points policy, with optional flat, floor
 * and cap components. bps is integer: 100 bps = 1%.
 */
export function computeFeeKobo(
  subtotalKobo: bigint,
  policy: { bps: number; flatKobo?: bigint; minFeeKobo?: bigint; maxFeeKobo?: bigint | null }
): bigint {
  if (policy.bps < 0 || policy.bps > 10_000) {
    throw new ValidationError("Fee bps must be between 0 and 10000");
  }
  let fee = divideRoundHalfUp(subtotalKobo * BigInt(policy.bps), 10_000n) + (policy.flatKobo ?? 0n);

  if (policy.minFeeKobo !== undefined && fee < policy.minFeeKobo) fee = policy.minFeeKobo;
  if (policy.maxFeeKobo !== undefined && policy.maxFeeKobo !== null && fee > policy.maxFeeKobo) {
    fee = policy.maxFeeKobo;
  }

  assertSaneKobo(fee, "Fee");
  return fee;
}

/** Parses a user-supplied litre value into a bounded 3dp Decimal. */
export function parseLitres(value: number | string, label = "Quantity"): Prisma.Decimal {
  let d: Prisma.Decimal;
  try {
    d = new Prisma.Decimal(value);
  } catch {
    throw new ValidationError(`${label} is not a valid number`);
  }
  if (!d.isFinite()) throw new ValidationError(`${label} must be a finite number`);
  if (d.lessThanOrEqualTo(0)) throw new ValidationError(`${label} must be greater than zero`);
  if (d.decimalPlaces() > 3) throw new ValidationError(`${label} supports at most 3 decimal places`);
  // 100 million litres is far beyond any single road/marine movement.
  if (d.greaterThan(100_000_000)) throw new ValidationError(`${label} exceeds the maximum permitted volume`);
  return d;
}

/**
 * Delivery variance against a tolerance in basis points of the ordered volume.
 * Returns the signed variance and whether it breaches tolerance.
 */
export function evaluateDeliveryVariance(
  orderedLitres: Prisma.Decimal,
  receivedLitres: Prisma.Decimal,
  toleranceBps: number
): { varianceLitres: Prisma.Decimal; flagged: boolean } {
  const variance = receivedLitres.minus(orderedLitres);
  const tolerance = orderedLitres.mul(toleranceBps).div(10_000);
  return { varianceLitres: variance, flagged: variance.abs().greaterThan(tolerance) };
}
