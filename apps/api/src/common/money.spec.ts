import { Prisma } from "@prisma/client";
import {
  computeFeeKobo,
  computeSubtotalKobo,
  divideRoundHalfUp,
  evaluateDeliveryVariance,
  koboToNairaString,
  nairaToKobo,
  parseLitres,
} from "./money";
import { ValidationError } from "./errors";

const D = (v: string | number) => new Prisma.Decimal(v);

describe("nairaToKobo", () => {
  it.each([
    ["0", 0n],
    ["1", 100n],
    ["1140.50", 114050n],
    ["1140.5", 114050n],
    ["0.01", 1n],
    ["-25.75", -2575n],
    [1140.5, 114050n],
  ])("converts %s -> %s kobo", (input, expected) => {
    expect(nairaToKobo(input as string | number)).toBe(expected);
  });

  it("rejects more than 2 decimal places", () => {
    expect(() => nairaToKobo("10.999")).toThrow(ValidationError);
  });

  it("rejects non-numeric input", () => {
    expect(() => nairaToKobo("1,140.50")).toThrow(ValidationError);
    expect(() => nairaToKobo("abc")).toThrow(ValidationError);
  });

  it("round-trips through koboToNairaString", () => {
    for (const v of ["0.00", "1.00", "1140.50", "999999.99", "-25.75"]) {
      expect(koboToNairaString(nairaToKobo(v))).toBe(Number(v).toFixed(2));
    }
  });
});

describe("divideRoundHalfUp", () => {
  it.each([
    [10n, 4n, 3n], // 2.5 -> 3 (half away from zero)
    [9n, 4n, 2n], // 2.25 -> 2
    [11n, 4n, 3n], // 2.75 -> 3
    [-10n, 4n, -3n], // -2.5 -> -3
    [7n, 2n, 4n], // 3.5 -> 4
    [5n, 1n, 5n],
  ])("divides %s / %s = %s", (n, d, expected) => {
    expect(divideRoundHalfUp(n, d)).toBe(expected);
  });

  it("rejects division by zero", () => {
    expect(() => divideRoundHalfUp(1n, 0n)).toThrow(ValidationError);
  });
});

describe("computeSubtotalKobo", () => {
  it("computes a whole-litre order exactly", () => {
    // 33,000 L at ₦1,140.00/L = ₦37,620,000.00
    expect(computeSubtotalKobo(D(33000), 114000n)).toBe(3_762_000_000n);
  });

  it("handles fractional litres without float drift", () => {
    // 1000.333 L at ₦1,140.55/L -> 114055 kobo/L
    // 1000333 mL * 114055 = 114,093,489,... scaled by 1000
    const expected = (1_000_333n * 114_055n + 500n) / 1000n; // half-up
    expect(computeSubtotalKobo(D("1000.333"), 114_055n)).toBe(expected);
  });

  it("is exact where floating point would drift", () => {
    // 0.1 + 0.2 style hazard: 3 × 33,333.333 L at 1 kobo/L
    const litres = D("33333.333");
    const once = computeSubtotalKobo(litres, 1n);
    expect(once).toBe(33_333n); // 33,333,333 mL / 1000 = 33,333.333 -> 33,333
  });

  it("rejects zero or negative quantity", () => {
    expect(() => computeSubtotalKobo(D(0), 100n)).toThrow(ValidationError);
    expect(() => computeSubtotalKobo(D(-1), 100n)).toThrow(ValidationError);
  });

  it("rejects zero or negative price", () => {
    expect(() => computeSubtotalKobo(D(100), 0n)).toThrow(ValidationError);
    expect(() => computeSubtotalKobo(D(100), -5n)).toThrow(ValidationError);
  });

  it("rejects an absurd total", () => {
    expect(() => computeSubtotalKobo(D(99_000_000), 10_000_000n)).toThrow(ValidationError);
  });
});

describe("computeFeeKobo", () => {
  it("applies basis points", () => {
    // 1% of ₦37,620,000 = ₦376,200
    expect(computeFeeKobo(3_762_000_000n, { bps: 100 })).toBe(37_620_000n);
  });

  it("applies a flat component", () => {
    expect(computeFeeKobo(1_000_000n, { bps: 0, flatKobo: 50_000n })).toBe(50_000n);
  });

  it("respects the minimum fee", () => {
    expect(computeFeeKobo(1000n, { bps: 100, minFeeKobo: 5_000n })).toBe(5_000n);
  });

  it("respects the maximum fee cap", () => {
    expect(computeFeeKobo(10_000_000_000n, { bps: 100, maxFeeKobo: 1_000_000n })).toBe(1_000_000n);
  });

  it("rounds half-up rather than truncating", () => {
    // 1 bps of 15,000 = 1.5 kobo -> 2
    expect(computeFeeKobo(15_000n, { bps: 1 })).toBe(2n);
  });

  it("rejects out-of-range bps", () => {
    expect(() => computeFeeKobo(100n, { bps: -1 })).toThrow(ValidationError);
    expect(() => computeFeeKobo(100n, { bps: 10_001 })).toThrow(ValidationError);
  });

  it("never exceeds the subtotal at 100%", () => {
    const subtotal = 1_000_000n;
    expect(computeFeeKobo(subtotal, { bps: 10_000 })).toBe(subtotal);
  });
});

describe("parseLitres", () => {
  it("accepts up to 3 decimal places", () => {
    expect(parseLitres("33000.125").toString()).toBe("33000.125");
  });

  it("rejects 4+ decimal places", () => {
    expect(() => parseLitres("1.0001")).toThrow(ValidationError);
  });

  it.each([0, -1, "0", "-5"])("rejects non-positive value %s", (v) => {
    expect(() => parseLitres(v as number | string)).toThrow(ValidationError);
  });

  it("rejects non-numeric and non-finite input", () => {
    expect(() => parseLitres("abc")).toThrow(ValidationError);
    expect(() => parseLitres(Number.POSITIVE_INFINITY)).toThrow(ValidationError);
    expect(() => parseLitres(Number.NaN)).toThrow(ValidationError);
  });

  it("rejects an implausibly large volume", () => {
    expect(() => parseLitres(200_000_000)).toThrow(ValidationError);
  });
});

describe("evaluateDeliveryVariance", () => {
  const TOLERANCE_BPS = 50; // 0.5%

  it("passes an exact delivery", () => {
    const r = evaluateDeliveryVariance(D(33000), D(33000), TOLERANCE_BPS);
    expect(r.varianceLitres.toString()).toBe("0");
    expect(r.flagged).toBe(false);
  });

  it("allows a shortfall within tolerance", () => {
    // 0.4% short of 33,000 = 132 L
    const r = evaluateDeliveryVariance(D(33000), D(32868), TOLERANCE_BPS);
    expect(r.flagged).toBe(false);
    expect(r.varianceLitres.toString()).toBe("-132");
  });

  it("flags a shortfall beyond tolerance", () => {
    // 1% short = 330 L
    const r = evaluateDeliveryVariance(D(33000), D(32670), TOLERANCE_BPS);
    expect(r.flagged).toBe(true);
    expect(r.varianceLitres.toString()).toBe("-330");
  });

  it("flags an over-delivery beyond tolerance too", () => {
    const r = evaluateDeliveryVariance(D(33000), D(33400), TOLERANCE_BPS);
    expect(r.flagged).toBe(true);
    expect(r.varianceLitres.toString()).toBe("400");
  });

  it("treats the tolerance boundary as acceptable", () => {
    // exactly 0.5% = 165 L
    const r = evaluateDeliveryVariance(D(33000), D(32835), TOLERANCE_BPS);
    expect(r.flagged).toBe(false);
  });
});
