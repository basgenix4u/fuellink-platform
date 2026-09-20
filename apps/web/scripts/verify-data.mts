/**
 * FuelLink L0 — dataset verification.
 * Re-validates every committed intelligence JSON against @fuellink/contracts.
 * Fails the process (and therefore CI) on any schema drift.
 *
 * Usage (from repo root):  npm run verify:data
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NmdpraDatasetSchema,
  PmsPriceDatasetSchema,
  LpgPriceDatasetSchema,
  LomeDatasetSchema,
  GantryDatasetSchema,
  LpgMarketDatasetSchema,
  JetDatasetSchema,
} from "@fuellink/contracts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../src/data/intelligence");

const SCHEMAS: Record<string, { parse: (v: unknown) => unknown }> = {
  "nmdpra-monthly.json": NmdpraDatasetSchema,
  "pms-prices.json": PmsPriceDatasetSchema,
  "lpg-prices.json": LpgPriceDatasetSchema,
  "lome-index.json": LomeDatasetSchema,
  "gantry-prices.json": GantryDatasetSchema,
  "lpg-market.json": LpgMarketDatasetSchema,
  "jet-a1.json": JetDatasetSchema,
};

let failures = 0;
for (const file of readdirSync(DATA_DIR).sort()) {
  const schema = SCHEMAS[file];
  if (!schema) {
    console.warn(`WARN  ${file}: no schema registered — skipping`);
    continue;
  }
  const raw = JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8"));
  try {
    schema.parse(raw);
    console.log(`OK    ${file}`);
  } catch (e) {
    failures++;
    console.error(`FAIL  ${file}`);
    if (e instanceof Error) console.error(e.message.slice(0, 2000));
  }
}

// quick integrity invariants (catch bad transcriptions early)
const nmdpra = SCHEMAS["nmdpra-monthly.json"].parse(JSON.parse(readFileSync(path.join(DATA_DIR, "nmdpra-monthly.json"), "utf8"))) as unknown as {
  months: {
    month: string;
    consumption: { pmsMld: number | null };
    sufficiencyDays: { pms: number | null };
    gas: {
      totalBscfPerDay: number | null;
      toPowerBscfPerDay: number | null;
      toCommercialBscfPerDay: number | null;
      toIndustriesBscfPerDay: number | null;
    };
  }[];
};
for (const m of nmdpra.months) {
  if (m.consumption.pmsMld != null && (m.consumption.pmsMld < 20 || m.consumption.pmsMld > 90)) {
    failures++;
    console.error(`FAIL  ${m.month}: PMS consumption ${m.consumption.pmsMld} ML/d outside plausible range 20–90`);
  }
  if (m.sufficiencyDays.pms != null && (m.sufficiencyDays.pms < 1 || m.sufficiencyDays.pms > 150)) {
    failures++;
    console.error(`FAIL  ${m.month}: PMS sufficiency ${m.sufficiencyDays.pms} days outside plausible range 1–150`);
  }
  // gas: national total is ~4–6 Bscf/d; a sectoral value that reaches (or
  // exceeds) the total — or a year token like 2026 — is a parse bug, not data
  if (m.gas.totalBscfPerDay != null && (m.gas.totalBscfPerDay < 0.5 || m.gas.totalBscfPerDay > 20)) {
    failures++;
    console.error(`FAIL  ${m.month}: gas total ${m.gas.totalBscfPerDay} Bscf/d outside plausible range 0.5–20`);
  }
  for (const [label, v] of [
    ["power", m.gas.toPowerBscfPerDay],
    ["commercial", m.gas.toCommercialBscfPerDay],
    ["industries", m.gas.toIndustriesBscfPerDay],
  ] as const) {
    if (v == null) continue;
    if (v < 0 || v > 20) {
      failures++;
      console.error(`FAIL  ${m.month}: gas ${label} ${v} Bscf/d outside plausible range 0–20 (year token?)`);
    } else if (m.gas.totalBscfPerDay != null && v >= m.gas.totalBscfPerDay) {
      failures++;
      console.error(`FAIL  ${m.month}: gas ${label} ${v} Bscf/d >= national total ${m.gas.totalBscfPerDay} — likely a mis-parsed total`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} verification failure(s)`);
  process.exit(1);
}
console.log("\nAll intelligence datasets valid.");
