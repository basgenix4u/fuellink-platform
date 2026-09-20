/**
 * FuelLink L0 — monthly "sector in numbers" report generator (deterministic).
 *
 * Reads the committed intelligence datasets and renders one structured report
 * per NMDPRA month: src/data/reports/<YYYY-MM>.json. Every sentence is built
 * from published dataset values; missing values render as "not reported";
 * arithmetic (MoM deltas, % of benchmark) is allowed and labelled derived in
 * the text where it matters.
 *
 * Same inputs → same outputs. No LLM, no invented figures.
 *
 * Usage (from repo root):  npm run generate:reports
 */

import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MonthlyReportSchema,
  STATE_LABELS,
  type NmdpraDataset,
  type NmdpraMonth,
  type PmsPriceDataset,
  type LpgPriceDataset,
  type LomeDataset,
  type ReportBullet,
  type ReportSection,
} from "@fuellink/contracts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../src/data/intelligence");
const OUT_DIR = path.resolve(__dirname, "../src/data/reports");

function load<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8")) as T;
}

const nmdpra = load<NmdpraDataset>("nmdpra-monthly.json");
const pmsPrices = load<PmsPriceDataset>("pms-prices.json");
const lpgPrices = load<LpgPriceDataset>("lpg-prices.json");
const lome = load<LomeDataset>("lome-index.json");

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function monthLabel(period: string): string {
  const [y, m] = period.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 });
const f = (n: number | null | undefined, d = 1): string => (n == null ? "not reported" : new Intl.NumberFormat("en-NG", { maximumFractionDigits: d }).format(n));
const naira = (n: number | null | undefined): string => (n == null ? "not reported" : `₦${nf.format(n)}`);

function bullet(text: string, tone: ReportBullet["tone"] = "neutral"): ReportBullet {
  return { text, tone };
}

function deltaText(cur: number | null, prev: number | null, unit: string, digits = 1): string {
  if (cur == null || prev == null) return "";
  const d = cur - prev;
  if (d === 0) return ` (unchanged MoM)`;
  const sign = d > 0 ? "+" : "−";
  return ` (${sign}${new Intl.NumberFormat("en-NG", { maximumFractionDigits: digits }).format(Math.abs(d))}${unit} MoM)`;
}

function buildReport(m: NmdpraMonth, prev: NmdpraMonth | undefined): unknown {
  const highlights: ReportBullet[] = [];
  const sections: ReportSection[] = [];
  const label = monthLabel(m.month);

  /* ------------------------------ highlights ----------------------------- */
  if (m.dprp.utilizationPct != null) {
    const tone = m.dprp.utilizationPct >= 90 ? "good" : m.dprp.utilizationPct >= 60 ? "warn" : "bad";
    highlights.push(bullet(
      `Dangote refinery ran at ${f(m.dprp.utilizationPct, 2)}% of installed capacity${deltaText(m.dprp.utilizationPct, prev?.dprp.utilizationPct ?? null, " pts")}.`,
      tone as ReportBullet["tone"]
    ));
  }
  if (m.consumption.pmsMld != null && m.benchmark.pmsMld != null) {
    const pct = (m.consumption.pmsMld / m.benchmark.pmsMld) * 100;
    highlights.push(bullet(
      `National PMS consumption was ${f(m.consumption.pmsMld)} ML/day — ${pct.toFixed(0)}% of the NMDPRA 2026 benchmark of ${f(m.benchmark.pmsMld, 0)} ML/day (derived).`
    ));
  }
  if (m.sufficiencyDays.pms != null) {
    const s = m.sufficiencyDays.pms;
    const tone = s >= 28 ? "good" : s >= 14 ? "warn" : "bad";
    const basis = m.sufficiencyDays.includesDprpStock ? " including Dangote refinery stock" : m.sufficiencyDays.includesDprpStock === false ? " excluding Dangote refinery stock" : "";
    highlights.push(bullet(`PMS stock sufficiency: ${f(s, 1)} days${basis}.`, tone as ReportBullet["tone"]));
  }
  if (m.supply.pmsImportMld != null) {
    highlights.push(bullet(
      `PMS import receipts: ${f(m.supply.pmsImportMld)} ML/day${deltaText(m.supply.pmsImportMld, prev?.supply.pmsImportMld ?? null, " ML/day")}.`
    ));
  }
  if (m.gas.totalBscfPerDay != null) {
    highlights.push(bullet(`National gas supply: ${f(m.gas.totalBscfPerDay, 3)} Bscf/day.`));
  }
  if (m.sufficiencyDays.lpg != null) {
    highlights.push(bullet(
      `LPG remains the tightest product: ${f(m.sufficiencyDays.lpg, 1)} days of national stock.`,
      m.sufficiencyDays.lpg <= 10 ? "bad" : "warn"
    ));
  }

  /* ------------------------------ DPRP table ----------------------------- */
  sections.push({
    id: "refinery",
    heading: "Refinery output — Dangote (DPRP)",
    bullets: [],
    table: {
      caption: "Average daily, ML/day unless noted. Source: NMDPRA fact sheet.",
      headers: ["Indicator", m.month],
      rows: [
      ["Utilization", f(m.dprp.utilizationPct, 2) + (m.dprp.utilizationPct != null ? "%" : "")],
      ["Peak utilization", m.dprp.peakUtilizationPct != null ? `${f(m.dprp.peakUtilizationPct, 2)}%` : "not reported"],
      ["PMS production", f(m.dprp.pmsProductionMld)],
      ["PMS domestic supply", f(m.dprp.pmsDomesticSupplyMld)],
      ["PMS exports", f(m.dprp.pmsExportMld)],
      ["AGO production", f(m.dprp.agoProductionMld)],
      ["AGO domestic supply", f(m.dprp.agoDomesticSupplyMld)],
      ["AGO exports", f(m.dprp.agoExportMld)],
      ["ATK production", f(m.dprp.atkProductionMld)],
      ["ATK domestic supply", f(m.dprp.atkDomesticSupplyMld)],
      ["ATK exports", f(m.dprp.atkExportMld)],
        ["Modular refineries — AGO domestic", f(m.modular.totalAgoDomesticMld, 3)],
      ],
    },
  });

  /* ------------------------- supply vs consumption ----------------------- */
  const supplyRows: string[][] = [
    ["PMS", `${f(m.consumption.pmsMld)} ML/d`, `${f(m.supply.pmsTotalMld)} ML/d`, `${f(m.benchmark.pmsMld, 0)} ML/d`],
    ["AGO", `${f(m.consumption.agodMld)} ML/d`, `${f(m.supply.agodTotalMld)} ML/d`, `${f(m.benchmark.agodMld, 0)} ML/d`],
    ["ATK", `${f(m.consumption.atkMld)} ML/d`, `${f(m.supply.atkMld)} ML/d`, `${f(m.benchmark.atkMld, 0)} ML/d`],
    ["LPG", `${f(m.consumption.lpgKtPerDay, 2)} kt/d`, `${f(m.supply.lpgKtPerDay, 2)} kt/d`, `${f(m.benchmark.lpgKtPerDay, 1)} kt/d`],
  ];
  sections.push({
    id: "supply-consumption",
    heading: "Supply & consumption vs regulator benchmarks",
    bullets: [],
    table: {
      caption: "NMDPRA 2026 daily demand benchmarks shown for reference.",
      headers: ["Product", "Consumption", "Supply (total)", "Benchmark"],
      rows: supplyRows,
    },
  });

  /* ------------------------------ sufficiency ---------------------------- */
  const suffNote =
    m.sufficiencyDays.includesDprpStock === true
      ? "Includes gross PMS stock at the Dangote refinery (per sheet note). From February 2026 the published basis includes DPRP stock; earlier months exclude it — compare across that boundary with care."
      : m.sufficiencyDays.includesDprpStock === false
        ? "Excludes DPRP PMS stock earmarked for the domestic market (per sheet note)."
        : "Sheet does not state whether DPRP stock is included for this month.";
  sections.push({
    id: "sufficiency",
    heading: "National fuel sufficiency (days of stock)",
    bullets: [],
    table: {
      caption: "Days the country could coast on existing national stock at the average daily consumption rate.",
      headers: ["Product", "Days", "vs previous month"],
      rows: (["pms", "agod", "atk", "lpg"] as const).map((k) => {
        const names = { pms: "PMS", agod: "AGO", atk: "ATK", lpg: "LPG" };
        const cur = m.sufficiencyDays[k];
        const pr = prev?.sufficiencyDays[k] ?? null;
        return [names[k], f(cur, 1), deltaText(cur, pr, " days").trim() || "—"];
      }),
    },
    note: suffNote,
  });

  /* -------------------------------- gas ---------------------------------- */
  const gasBullets: ReportBullet[] = [];
  if (m.gas.totalBscfPerDay != null) gasBullets.push(bullet(`Total gas supplied: ${f(m.gas.totalBscfPerDay, 3)} Bscf/day.`));
  if (m.gas.nlngBscfPerDay != null) gasBullets.push(bullet(`NLNG: ${f(m.gas.nlngBscfPerDay, 3)} Bscf/day.`));
  if (m.gas.domesticBscfPerDay != null) gasBullets.push(bullet(`Domestic: ${f(m.gas.domesticBscfPerDay, 3)} Bscf/day.`));
  const sectoral: [string, number | null][] = [
    ["Power", m.gas.toPowerBscfPerDay],
    ["Commercial", m.gas.toCommercialBscfPerDay],
    ["Industries", m.gas.toIndustriesBscfPerDay],
  ];
  if (sectoral.some(([, v]) => v != null)) {
    gasBullets.push(bullet(
      `Sectoral split — power ${f(m.gas.toPowerBscfPerDay, 3)}, commercial ${f(m.gas.toCommercialBscfPerDay, 3)}, industries ${f(m.gas.toIndustriesBscfPerDay, 3)} Bscf/day.`
    ));
  }
  if (gasBullets.length > 0) {
    sections.push({ id: "gas", heading: "Gas sector", bullets: gasBullets });
  }

  /* ------------------------------- prices -------------------------------- */
  const priceMonth = pmsPrices.months.find((p) => p.period === m.month);
  if (priceMonth) {
    const priceBullets: ReportBullet[] = [];
    if (priceMonth.nfemRatePerUsd != null) priceBullets.push(bullet(`NFEM average rate used in the computation: ${naira(priceMonth.nfemRatePerUsd)}/USD.`));
    if (priceMonth.brentUsdPerBarrel != null) priceBullets.push(bullet(`Brent: $${f(priceMonth.brentUsdPerBarrel, 2)}/barrel; gasoline benchmark $${f(priceMonth.gasolineUsdPerMt, 2)}/tonne.`));
    const priceRows = priceMonth.states.map((s) => [
      STATE_LABELS[s.state],
      naira(s.indicativePerLitre),
      naira(s.maxActualPerLitre),
      naira(s.minActualPerLitre),
      naira(s.avgActualPerLitre),
    ]);
    sections.push({
      id: "prices",
      heading: "PMS pump prices by state",
      table: {
        caption: "NMDPRA indicative price + observed actuals, ₦/litre.",
        headers: ["State", "Indicative", "Max actual", "Min actual", "Avg actual"],
        rows: priceRows,
      },
      bullets: priceBullets,
    });
  }
  const lpgMonth = lpgPrices.months.find((p) => p.period === m.month);
  if (lpgMonth?.nationalRangePerKg) {
    const b: ReportBullet[] = [bullet(
      `LPG national retail range: ${naira(lpgMonth.nationalRangePerKg[0])}–${naira(lpgMonth.nationalRangePerKg[1])}/kg.`
    )];
    sections.push({ id: "lpg-prices", heading: "LPG retail prices", bullets: b });
  } else if (lpgMonth?.states) {
    sections.push({
      id: "lpg-prices",
      heading: "LPG retail prices by state",
      bullets: [],
      table: {
        caption: "First month with a full state table.",
        headers: ["State", "Max (₦/kg)", "Min (₦/kg)", "Avg (₦/kg)"],
        rows: lpgMonth.states.map((st) => [STATE_LABELS[st.state], f(st.maxPerKg, 0), f(st.minPerKg, 0), f(st.avgPerKg, 0)]),
      },
    });
  }

  /* ----------------------------- trade / Lomé ---------------------------- */
  const tradeMonth = lome.monthly.find((t) => t.month === m.month);
  if (tradeMonth) {
    const tb: ReportBullet[] = [];
    if (tradeMonth.pmsImportMld != null) tb.push(bullet(`PMS import receipts: ${f(tradeMonth.pmsImportMld)} ML/day (NMDPRA).`));
    const exports = [
      tradeMonth.pmsExportMld != null ? `PMS ${f(tradeMonth.pmsExportMld)}` : null,
      tradeMonth.agodExportMld != null ? `AGO ${f(tradeMonth.agodExportMld)}` : null,
      tradeMonth.atkExportMld != null ? `ATK ${f(tradeMonth.atkExportMld)}` : null,
    ].filter(Boolean);
    if (exports.length > 0) tb.push(bullet(`DPRP product exports: ${exports.join(", ")} ML/day.`));
    if (m.month >= "2026-03" && m.month <= "2026-05") {
      tb.push(
        bullet(
          `Context: S&P Global Commodity Insights (via MEMAN) estimated 70–80% of Nigeria's waterborne fuel "imports" in this period were DPRP product routed via Lomé, Togo.`,
          "warn"
        )
      );
    }
    sections.push({ id: "trade", heading: "Trade flows & the Lomé question", bullets: tb });
  }

  /* ----------------------------- pipeline progress ----------------------- */
  const pipe = nmdpra.pipelineProgress.find((p) => p.asOf === m.month);
  if (pipe) {
    sections.push({
      id: "pipeline",
      heading: "Pipeline completion (NGIC, via fact sheet)",
      bullets: [],
      table: {
        caption: "As reported in the sheet.",
        headers: ["Pipeline", "Complete"],
        rows: [
          ["Akan-Koko (AKK)", f(pipe.akkPct) + "%"],
          ["Obang Archi–Obio-Akpor (OB3) overall", f(pipe.ob3OverallPct) + "%"],
          ["OB3 Niger delta crossing", f(pipe.ob3NigerCrossingPct) + "%"],
          ["Odidi–Warri (OWEP)", f(pipe.odidiWarriPct) + "%"],
          ["Escravos–Odidi (EOP)", f(pipe.escravosOdidiPct) + "%"],
          ["ELPS midline", f(pipe.elpsMidlinePct) + "%"],
          ["Overall", f(pipe.overallPct) + "%"],
        ],
      },
    });
  }

  /* -------------------------------- description -------------------------- */
  const description =
    highlights.slice(0, 2).map((h) => h.text).join(" ") +
    " Full breakdown of Nigeria's downstream sector from the NMDPRA fact sheet.";

  return {
    month: m.month,
    title: `Nigeria fuel sector in numbers — ${label}`,
    description,
    generatedAt: nmdpra.generatedAt,
    sourceUrl: m.sourceUrl,
    site: nmdpra.source.site,
    highlights,
    sections,
    sources: [
      { label: `NMDPRA fact sheet (${label}) — source PDF`, url: m.sourceUrl },
      { label: "NMDPRA website", url: nmdpra.source.site },
      { label: "FuelLink Intelligence", url: "/intel" },
    ],
  };
}

/* --------------------------------- main ---------------------------------- */

function main() {
  const months = [...nmdpra.months].sort((a, b) => a.month.localeCompare(b.month));
  mkdirSync(OUT_DIR, { recursive: true });
  let count = 0;
  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    const prev = i > 0 ? months[i - 1] : undefined;
    const raw = buildReport(m, prev);
    const report = MonthlyReportSchema.parse(raw); // fail loud on schema drift
    const file = path.join(OUT_DIR, `${m.month}.json`);
    writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
    console.log(`OK    ${m.month}.json — ${report.sections.length} sections, ${report.highlights.length} highlights`);
    count++;
  }
  // remove stale reports for months no longer in the dataset
  for (const file of readdirSync(OUT_DIR)) {
    if (file.endsWith(".json") && !months.some((m) => m.month === file.replace(".json", ""))) {
      rmSync(path.join(OUT_DIR, file));
      console.log(`REMOVED ${file} (month no longer in dataset)`);
    }
  }
  console.log(`Wrote ${count} monthly reports to ${path.relative(process.cwd(), OUT_DIR)}`);
}

main();
