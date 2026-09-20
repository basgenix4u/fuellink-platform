import { z } from "zod";

/**
 * FuelLink L0 Intelligence — data contracts.
 *
 * Every number in the datasets below is a real published figure:
 *  - NMDPRA monthly "State of the Midstream and Downstream Sector" fact sheets
 *    (official PDFs, public Azure blob container — see `source` blocks)
 *  - NBS foreign trade statistics
 *  - Sourced market research (attributed per-dataset)
 * No fabricated values. Missing values are null, never estimated.
 */

export const STATE_KEYS = [
  "lagos",
  "abuja",
  "kano",
  "calabar",
  "sokoto",
  "maiduguri",
  "ibadan",
  "enugu",
] as const;

export const StateKey = z.enum(STATE_KEYS);
export type StateKey = z.infer<typeof StateKey>;

export const STATE_LABELS: Record<StateKey, string> = {
  lagos: "Lagos",
  abuja: "Abuja",
  kano: "Kano",
  calabar: "Calabar",
  sokoto: "Sokoto",
  maiduguri: "Maiduguri",
  ibadan: "Ibadan",
  enugu: "Enugu",
};

const monthStr = z.string().regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/, "expected YYYY-MM");
const num = z.number().finite();
const optNum = num.nullable();

/* ---------------------------------- PMS ---------------------------------- */

export const PmsStatePriceRow = z.object({
  state: StateKey,
  /** NMDPRA "indicative pump price" (₦/L) */
  indicativePerLitre: optNum,
  maxActualPerLitre: optNum,
  minActualPerLitre: optNum,
  avgActualPerLitre: optNum,
});

export const PmsPriceMonthSchema = z.object({
  /** Price period, YYYY-MM */
  period: monthStr,
  label: z.string(),
  sourceUrl: z.string().url(),
  /** Average NFEM FX rate used in the NMDPRA price computation (₦/USD) */
  nfemRatePerUsd: optNum,
  brentUsdPerBarrel: optNum,
  gasolineUsdPerMt: optNum,
  states: z.array(PmsStatePriceRow),
  notes: z.array(z.string()).default([]),
});

/* ---------------------------------- LPG ---------------------------------- */

export const LpgStatePriceRow = z.object({
  state: StateKey,
  maxPerKg: optNum,
  minPerKg: optNum,
  avgPerKg: optNum,
});

export const LpgPriceMonthSchema = z.object({
  period: monthStr,
  label: z.string(),
  sourceUrl: z.string().url(),
  /** National observed retail range (₦/kg) from the fact sheet */
  nationalRangePerKg: z.tuple([num, num]).nullable(),
  /** Full state table when published (from June 2026 sheets onwards) */
  states: z.array(LpgStatePriceRow).nullable(),
  notes: z.array(z.string()).default([]),
});

/* ------------------------------ NMDPRA monthly ---------------------------- */

export const ModularUnit = z.object({
  name: z.enum(["waltersmith", "edo", "aradel", "opac", "duport"]),
  utilizationPct: optNum,
  agoDomesticMld: optNum,
});

export const NmdpraMonthSchema = z.object({
  month: monthStr,
  label: z.string(),
  sourceUrl: z.string().url(),
  /** PDF upload (Last-Modified) timestamp, ISO */
  releasedAt: z.string(),
  /** Dangote Petroleum Refinery & Petrochemical (DPRP) */
  dprp: z.object({
    utilizationPct: optNum,
    peakUtilizationPct: optNum,
    pmsProductionMld: optNum,
    pmsDomesticSupplyMld: optNum,
    pmsExportMld: optNum,
    agoProductionMld: optNum,
    agoDomesticSupplyMld: optNum,
    agoExportMld: optNum,
    atkProductionMld: optNum,
    atkDomesticSupplyMld: optNum,
    atkExportMld: optNum,
  }),
  modular: z.object({
    totalAgoDomesticMld: optNum,
    units: z.array(ModularUnit).default([]),
  }),
  /** National product supply (ML/day unless noted) */
  supply: z.object({
    pmsTotalMld: optNum,
    pmsDomesticMld: optNum,
    pmsImportMld: optNum,
    agodTotalMld: optNum,
    agodDomesticMld: optNum,
    agodImportMld: optNum,
    atkMld: optNum,
    lpgKtPerDay: optNum,
    /** Crude received by domestic refineries (Mbbl/day) */
    crudeMbd: optNum,
  }),
  /** Average daily consumption, trucked out (ML/day; LPG in kt/day) */
  consumption: z.object({
    pmsMld: optNum,
    agodMld: optNum,
    atkMld: optNum,
    lpgKtPerDay: optNum,
  }),
  /** National fuel sufficiency (days) */
  sufficiencyDays: z.object({
    pms: optNum,
    agod: optNum,
    atk: optNum,
    lpg: optNum,
    /** Whether the figure includes DPRP stock (flagged on the sheet) */
    includesDprpStock: z.boolean().nullable(),
  }),
  lpg: z.object({
    supplyMtPerDay: optNum,
    consumptionMtPerDay: optNum,
  }),
  gas: z.object({
    totalBscfPerDay: optNum,
    nlngBscfPerDay: optNum,
    domesticBscfPerDay: optNum,
    toPowerBscfPerDay: optNum,
    toCommercialBscfPerDay: optNum,
    toIndustriesBscfPerDay: optNum,
  }),
  /** NMDPRA daily demand benchmarks (2026) */
  benchmark: z.object({
    pmsMld: optNum,
    agodMld: optNum,
    atkMld: optNum,
    lpgKtPerDay: optNum,
  }),
  notes: z.array(z.string()).default([]),
});

export const PipelineProgress = z.object({
  asOf: monthStr,
  label: z.string(),
  akkPct: optNum,
  ob3OverallPct: optNum,
  ob3NigerCrossingPct: optNum,
  odidiWarriPct: optNum,
  escravosOdidiPct: optNum,
  elpsMidlinePct: optNum,
  overallPct: optNum,
  sourceUrl: z.string().url(),
});

export const NmdpraDatasetSchema = z.object({
  generatedAt: z.string(),
  source: z.object({
    name: z.literal("Nigerian Midstream and Downstream Petroleum Regulatory Authority (NMDPRA)"),
    description: z.string(),
    containerListUrl: z.string().url(),
    site: z.string().url(),
  }),
  months: z.array(NmdpraMonthSchema),
  pipelineProgress: z.array(PipelineProgress).default([]),
});

/* ------------------------------ Lomé / trade ------------------------------ */

export const LomeMonth = z.object({
  month: monthStr,
  label: z.string(),
  /** PMS import receipts (ML/day) — NMDPRA fact sheet */
  pmsImportMld: optNum,
  /** DPRP PMS exports (ML/day) — NMDPRA fact sheet */
  pmsExportMld: optNum,
  atkExportMld: optNum,
  agodExportMld: optNum,
  sourceUrl: z.string().url(),
});

export const NbsExportItem = z.object({
  product: z.string(),
  destination: z.string().nullable(),
  nairaBillion: num,
});

export const LomeDatasetSchema = z.object({
  generatedAt: z.string(),
  paradox: z.object({
    title: z.string(),
    statement: z.string(),
    period: z.string(),
    shareRange: z.tuple([num, num]),
    source: z.string(),
  }),
  monthly: z.array(LomeMonth),
  nbsQ1Exports: z.object({
    period: z.string(),
    items: z.array(NbsExportItem),
    otherDestinations: z.array(z.string()),
    source: z.string(),
  }),
  jetExports: z.object({
    may2026Mt: num,
    april2026PctChangeYoy: num,
    april2026Bpd: num,
    topDestination: z.string(),
    topDestinationSharePct: optNum,
    source: z.string(),
  }),
});

/* --------------------------- Gantry price tracker -------------------------- */

export const GantryPricePoint = z.object({
  /** YYYY-MM-DD (or YYYY-MM for monthly averages) */
  date: z.string(),
  product: z.enum(["PMS", "AGO", "ATK", "LPG"]),
  issuer: z.enum(["dprp", "nnpc", "nmdpra_indicative_lagos", "nmdpra_indicative_abuja"]),
  /** ₦/litre or ₦/kg for LPG */
  price: num,
  priceHigh: optNum,
  basis: z.enum(["gantry", "indicative", "pump_avg"]),
  source: z.string(),
  note: z.string().nullable(),
});

export const GantryDatasetSchema = z.object({
  generatedAt: z.string(),
  description: z.string(),
  points: z.array(GantryPricePoint),
});

/* --------------------------------- LPG desk -------------------------------- */

export const LpgMarketDatasetSchema = z.object({
  generatedAt: z.string(),
  demandMt: z.object({
    value: num,
    year: num,
    source: z.string(),
  }),
  supplyMt: z.object({
    min: num,
    max: num,
    year: num,
    source: z.string(),
  }),
  bufferDays: z.object({
    value: num,
    source: z.string(),
  }),
  pricePerKgHistory: z.array(z.object({ year: num, nairaPerKg: num })),
  exportSharePct: z.object({
    value: num,
    source: z.string(),
  }),
  producers: z.array(z.string()),
  policyNote: z.string(),
});

/* -------------------------------- Jet A-1 desk ----------------------------- */

export const JetPricePoint = z.object({
  date: z.string(),
  nairaPerLitre: num,
  nairaPerLitreHigh: optNum,
  source: z.string(),
  note: z.string().nullable(),
});

export const JetDatasetSchema = z.object({
  generatedAt: z.string(),
  timeline: z.array(JetPricePoint),
  dprpPricingModel: z.object({
    currency: z.literal("USD"),
    priceHoldbackPct: num,
    note: z.string(),
  }),
  airportSpreadExample: z.object({
    airport: z.string(),
    minPerLitre: num,
    maxPerLitre: num,
    source: z.string(),
  }),
  context: z.array(z.string()),
});

export const PmsPriceDatasetSchema = z.object({
  generatedAt: z.string(),
  source: z.string(),
  months: z.array(PmsPriceMonthSchema),
});

export const LpgPriceDatasetSchema = z.object({
  generatedAt: z.string(),
  source: z.string(),
  months: z.array(LpgPriceMonthSchema),
});

/* ------------------------------ NMDPRA monthly ---------------------------- */

/* ------------------------- Monthly reports (SEO) -------------------------- */

export const ReportBulletSchema = z.object({
  text: z.string(),
  tone: z.enum(["neutral", "good", "warn", "bad"]).default("neutral"),
});

export const ReportTableSchema = z.object({
  caption: z.string().nullable(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

export const ReportSectionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  bullets: z.array(ReportBulletSchema).default([]),
  table: ReportTableSchema.nullable().optional(),
  note: z.string().nullable().optional(),
});

export const ReportSourceSchema = z.object({
  label: z.string(),
  /** Absolute URL or site-internal path (e.g. /intel). */
  url: z.union([z.string().url(), z.string().regex(/^\//)]),
});

export const MonthlyReportSchema = z.object({
  month: monthStr,
  title: z.string(),
  description: z.string(),
  generatedAt: z.string(),
  sourceUrl: z.string().url(),
  site: z.string().url(),
  highlights: z.array(ReportBulletSchema),
  sections: z.array(ReportSectionSchema),
  sources: z.array(ReportSourceSchema),
});

export type PmsPriceMonth = z.infer<typeof PmsPriceMonthSchema>;
export type LpgPriceMonth = z.infer<typeof LpgPriceMonthSchema>;
export type NmdpraDataset = z.infer<typeof NmdpraDatasetSchema>;
export type NmdpraMonth = z.infer<typeof NmdpraMonthSchema>;
export type PmsPriceDataset = z.infer<typeof PmsPriceDatasetSchema>;
export type LpgPriceDataset = z.infer<typeof LpgPriceDatasetSchema>;
export type GantryDataset = z.infer<typeof GantryDatasetSchema>;
export type LomeDataset = z.infer<typeof LomeDatasetSchema>;
export type LpgMarketDataset = z.infer<typeof LpgMarketDatasetSchema>;
export type JetDataset = z.infer<typeof JetDatasetSchema>;
export type ReportBullet = z.infer<typeof ReportBulletSchema>;
export type ReportSection = z.infer<typeof ReportSectionSchema>;
export type MonthlyReport = z.infer<typeof MonthlyReportSchema>;
