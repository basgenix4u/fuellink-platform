/**
 * FuelLink Intelligence (L0) — typed data access + formatting helpers.
 *
 * Every value comes from the committed datasets in src/data/intelligence/,
 * produced by scripts/ingest-nmdpra.mts from NMDPRA's public fact sheets
 * and sourced market research. Nothing here is estimated: missing values
 * stay null and render as "not reported".
 */

import type {
  NmdpraDataset,
  NmdpraMonth,
  PmsPriceDataset,
  LpgPriceDataset,
  LomeDataset,
  GantryDataset,
  LpgMarketDataset,
  JetDataset,
  StateKey,
} from "@fuellink/contracts";
import { STATE_LABELS } from "@fuellink/contracts";

import nmdpraRaw from "@/data/intelligence/nmdpra-monthly.json";
import pmsPricesRaw from "@/data/intelligence/pms-prices.json";
import lpgPricesRaw from "@/data/intelligence/lpg-prices.json";
import lomeRaw from "@/data/intelligence/lome-index.json";
import gantryRaw from "@/data/intelligence/gantry-prices.json";
import lpgMarketRaw from "@/data/intelligence/lpg-market.json";
import jetRaw from "@/data/intelligence/jet-a1.json";

export const nmdpra = nmdpraRaw as unknown as NmdpraDataset;
export const pmsPrices = pmsPricesRaw as unknown as PmsPriceDataset;
export const lpgPrices = lpgPricesRaw as unknown as LpgPriceDataset;
export const lome = lomeRaw as unknown as LomeDataset;
export const gantry = gantryRaw as unknown as GantryDataset;
export const lpgMarket = lpgMarketRaw as unknown as LpgMarketDataset;
export const jet = jetRaw as unknown as JetDataset;

/** Generated-at stamp shared by all datasets (same ingest run). */
export const generatedAt = nmdpra.generatedAt;
export const generatedAtDate = new Date(generatedAt).toISOString().slice(0, 10);

/** Short month label, e.g. "2026-07" → "Jul 2026". */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export function monthLabel(period: string): string {
  const [y, m] = period.split("-");
  const mi = parseInt(m, 10) - 1;
  return MONTHS[mi] ? `${MONTHS[mi]} ${y}` : period;
}

/** Latest (max month) NMDPRA snapshot. */
export function latestMonth(): NmdpraMonth {
  return [...nmdpra.months].sort((a, b) => a.month.localeCompare(b.month)).at(-1)!;
}

/** Previous snapshot relative to a month key. */
export function monthBefore(month: string): NmdpraMonth | undefined {
  const sorted = [...nmdpra.months].sort((a, b) => a.month.localeCompare(b.month));
  const idx = sorted.findIndex((m) => m.month === month);
  return idx > 0 ? sorted[idx - 1] : undefined;
}

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 });
const nf1 = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });

export function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return decimals <= 1 ? nf1.format(n) : nf.format(n);
}

const nf0 = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
export function fmtNaira(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return `₦${(decimals === 0 ? nf0 : nf).format(n)}`;
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${nf1.format(n)}%`;
}

/** Signed delta in naira, e.g. "+₦35.00". */
export function fmtDelta(cur: number | null | undefined, prev: number | null | undefined): string {
  if (cur == null || prev == null) return "—";
  const d = cur - prev;
  if (d === 0) return "₦0.00";
  return `${d > 0 ? "+" : "−"}₦${nf.format(Math.abs(d))}`;
}

export { STATE_LABELS };
export type { StateKey, NmdpraMonth, NmdpraDataset, LomeDataset, GantryDataset, JetDataset };
