/**
 * FuelLink L0 — NMDPRA fact-sheet ingestion pipeline.
 *
 * Enumerates NMDPRA's public fact-sheet blob container, downloads monthly
 * PDFs, parses the key tables, validates against @fuellink/contracts (zod),
 * and writes the intelligence JSON datasets consumed by the /intel pages.
 *
 * Usage (from repo root):  npm run ingest:nmdpra
 *
 * Every parsed value is a real published NMDPRA figure. Where a value could
 * not be extracted from the PDF layout it is filled from the clearly-labelled
 * MANUAL_OVERRIDES table below (also transcribed from the same PDF) — never
 * estimated. Missing values stay null.
 */

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
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
  type NmdpraMonth,
  type PmsPriceMonth,
  type LpgPriceMonth,
  type StateKey,
  type LomeDataset,
  type GantryDataset,
  type LpgMarketDataset as Tlpg,
  type JetDataset as Tjet,
} from "@fuellink/contracts";

const require = createRequire(import.meta.url);
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require("pdf-parse");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../src/data/intelligence");
const CACHE_DIR = path.resolve(__dirname, "../.cache/nmdpra");

const CONTAINER_LIST_URL =
  "https://alps.blob.core.windows.net/nmdprawebsite?restype=container&comp=list&prefix=Statistics/&maxresults=200";
const BLOB_BASE = "https://alps.blob.core.windows.net/nmdprawebsite/";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* --------------------------------- helpers -------------------------------- */

function norm(t: string): string {
  return t
    .replace(/\uFB01/g, "fi") // ﬁ ligature
    .replace(/\uA789/g, ":") // ꞉
    .replace(/‑/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/Suf[^a-zA-Z\n]{0,3}ciency/g, "Sufficiency") // "Suf?ciency" extraction artefact
    .replace(/Suf{2,}i?ciency/g, "Sufficiency") // ffi-ligature expanded to extra f's
    .replace(/[ \t]+/g, " ");
}

function num(s: string | undefined | null): number | null {
  if (s == null) return null;
  const v = parseFloat(s.replace(/,/g, "").replace(/^N/, "").replace(/₦/g, "").trim());
  return Number.isFinite(v) ? v : null;
}

function search(hay: string, re: RegExp, group = 1): string | null {
  const m = hay.match(re);
  if (!m) return null;
  return m[group] ?? m[0];
}

function sectionWindow(text: string, heading: RegExp, span = 700): string | null {
  const m = text.match(heading);
  if (!m) return null;
  const start = m.index! + m[0].length;
  return text.slice(start, start + span);
}

/**
 * Parse a run of concatenated/whitespace-separated numbers, bounding decimals
 * to `maxDecimals` so that glued values like "928.06951.42" split correctly
 * (→ 928.06, 951.42) while "0.6120.578" is NOT mis-split at 2 decimals.
 */
function floats(s: string, maxDecimals = 2): number[] {
  const out: number[] = [];
  const re = new RegExp(`\\d[\\d,]*(?:\\.\\d{1,${maxDecimals}})?`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(parseFloat(m[0].replace(/,/g, "")));
  return out;
}

function monthKey(monthName: string, year: number): string {
  return `${year}-${String(MONTH_NAMES.indexOf(monthName) + 1).padStart(2, "0")}`;
}

function detectMonth(text: string): { name: string; year: number } | null {
  const names = "(January|February|March|April|May|June|July|August|September|October|November|December)";
  const oldFmt = text.match(new RegExp(`NMDPRA Fact Sheet\\s*${names}\\s+(\\d{4})`));
  if (oldFmt) return { name: oldFmt[1], year: parseInt(oldFmt[2], 10) };
  const head = text.slice(0, 600).match(new RegExp(`${names}\\s+(\\d{4})`));
  if (head) return { name: head[1], year: parseInt(head[2], 10) };
  return null;
}

/* ------------------------------ container listing -------------------------- */

interface BlobEntry { url: string; modified: string; size: number }

async function listFactSheets(): Promise<BlobEntry[]> {
  const out: BlobEntry[] = [];
  let marker: string | null = null;
  for (;;) {
    const url: string = marker ? `${CONTAINER_LIST_URL}&marker=${encodeURIComponent(marker)}` : CONTAINER_LIST_URL;
    const xml: string = await (await fetch(url)).text();
    const blobRe = /<Blob><Name>(Statistics\/[^<]+)<\/Name>.*?<Last-Modified>([^<]+)<\/Last-Modified>.*?<Content-Length>(\d+)<\/Content-Length>/gs;
    let m: RegExpExecArray | null;
    while ((m = blobRe.exec(xml))) {
      out.push({ url: BLOB_BASE + m[1], modified: m[2], size: parseInt(m[3], 10) });
    }
    const nm: RegExpMatchArray | null = xml.match(/<NextMarker>([^<]+)<\/NextMarker>/);
    if (!nm) break;
    marker = nm[1];
  }
  return out.sort((a, b) => a.modified.localeCompare(b.modified));
}

/* --------------------------------- parsers --------------------------------- */

function parseConsumption(text: string) {
  const heads = [
    /2\.\s*Daily Consumption \(truck out\)/,
    /[234]\.\s*Daily Consumption of key Petroleum\s*Products/i,
    /Average Daily Consumption of Key Petroleum Products/i,
    /Daily Consumption of key petroleum products/,
  ];
  for (const h of heads) {
    const w = sectionWindow(text, h, 420);
    if (!w) continue;
    const pairs: { v: number; tonnes: boolean }[] = [];
    const re = /([\d,]+(?:\.\d{1,2})?)\s*(ML\/day|mn litres\/day|million litres\/day|KT\/day|MT\/day|mt\/day|mn tonnes)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(w)) && pairs.length < 4) {
      const unit = m[2];
      const isKt = /^KT/.test(unit);
      const isMt = /MT|mt|tonnes/.test(unit) && !isKt;
      if (isKt || isMt) pairs.push({ v: isKt ? parseFloat(m[1].replace(/,/g, "")) : parseFloat(m[1].replace(/,/g, "")) / 1000, tonnes: true });
      else pairs.push({ v: parseFloat(m[1].replace(/,/g, "")), tonnes: false });
    }
    if (pairs.length === 4) {
      const lit = pairs.filter((p) => !p.tonnes).map((p) => p.v);
      const ton = pairs.filter((p) => p.tonnes).map((p) => p.v);
      if (lit.length === 3 && ton.length === 1) {
        return { pmsMld: lit[0], agodMld: lit[1], atkMld: lit[2], lpgKtPerDay: ton[0] };
      }
    }
  }
  return null;
}

function parseSufficiency(text: string) {
  const w = sectionWindow(text, /National Fuel Suf.{0,3}ciency/, 500);
  if (!w) return null;
  const days: number[] = [];
  const re = /([\d.]+)\s*Days?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(w)) && days.length < 5) days.push(parseFloat(m[1]));
  if (days.length < 4) return null;
  const includesDprp = /includes (gross |pumpable )?stock at DPRP|includes.*Dangote|inclusive of.*DPRP/i.test(w)
    ? true
    : /does not include DPRP/i.test(w)
      ? false
      : null;
  return { pms: days[0], agod: days[1], atk: days[2], lpg: days[3], includesDprpStock: includesDprp };
}

/** PMS state price table (NMDPRA "Indicative Fuel Prices", 8 states). */
function parsePmsPriceTable(text: string, sourceUrl: string): PmsPriceMonth | null {
  const headIdx = text.indexOf("S/NODESCRIPTION");
  if (headIdx < 0) return null;
  const w = text.slice(headIdx, headIdx + 900).replace(/(\d)\s+,/g, "$1,");
  const nfem = search(w, /N([\d,]+(?:\.\d{1,2})?)\s*\/USD/);
  const brent = search(w, /Brent\)?[:\s]*\$([\d,]+(?:\.\d{1,2})?)/);
  const gaso = search(w, /GASOLINE COST[:\s]*\$([\d,]+(?:\.\d{1,2})?)/);
  const periodM = w.match(/PRICE FOR THE PERIOD[\s\S]{0,60}?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
  const rowRe = /(\d[\d,]*(?:\.\d{1,2})?(?:\s+\d[\d,]*(?:\.\d{1,2})?){6,7})/g;
  const rows: number[][] = [];
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(w)) && rows.length < 4) {
    const f = floats(m[1], 2);
    if (f.length === 8) rows.push(f);
  }
  if (rows.length < 4 || !periodM) return null;
  const periodName = periodM[1][0].toUpperCase() + periodM[1].slice(1).toLowerCase();
  const states: StateKey[] = ["lagos", "abuja", "kano", "calabar", "sokoto", "maiduguri", "ibadan", "enugu"];
  return {
    period: monthKey(periodName, parseInt(periodM[2], 10)),
    label: `${periodName} ${periodM[2]}`,
    sourceUrl,
    nfemRatePerUsd: num(nfem),
    brentUsdPerBarrel: num(brent),
    gasolineUsdPerMt: num(gaso),
    states: states.map((state, i) => ({
      state,
      indicativePerLitre: rows[0][i] ?? null,
      maxActualPerLitre: rows[1][i] ?? null,
      minActualPerLitre: rows[2][i] ?? null,
      avgActualPerLitre: rows[3][i] ?? null,
    })),
    notes: [],
  };
}

/** LPG retail price table (state rows) + national range line. */
function parseLpgPrice(text: string): Partial<Pick<LpgPriceMonth, "states" | "nationalRangePerKg">> {
  const out: Partial<Pick<LpgPriceMonth, "states" | "nationalRangePerKg">> = {};
  const tblIdx = text.indexOf("STATES");
  if (tblIdx >= 0) {
    const w = text.slice(tblIdx, tblIdx + 1000).replace(/(\d)\s+,/g, "$1,");
    const header = w.slice(0, 90).toUpperCase();
    const order: StateKey[] = [];
    for (const s of ["LAGOS", "ABUJA", "KANO", "CALABAR", "IBADAN", "SOKOTO", "MAIDUGURI", "ENUGU"] as const) {
      const labels: Record<string, StateKey> = {
        LAGOS: "lagos", ABUJA: "abuja", KANO: "kano", CALABAR: "calabar",
        IBADAN: "ibadan", SOKOTO: "sokoto", MAIDUGURI: "maiduguri", ENUGU: "enugu",
      };
      if (header.includes(s)) order.push(labels[s]);
    }
    if (order.length === 8) {
      const grab = (label: string) => {
        const m = w.match(new RegExp(`${label}[\\s\\S]{0,90}?((?:\\d[\\d,]*\\.\\d{2}\\s+){7}\\d[\\d,]*\\.\\d{2})`));
        return m ? floats(m[1], 2) : [];
      };
      const max = grab("MAXIMUM");
      const min = grab("MINIMUM");
      const avg = grab("AVERAGE");
      if (max.length === 8 && min.length === 8 && avg.length === 8) {
        out.states = order.map((state, i) => ({
          state,
          maxPerKg: max[i] ?? null,
          minPerKg: min[i] ?? null,
          avgPerKg: avg[i] ?? null,
        }));
      }
    }
  }
  const range = text.match(/N([\d,]+)\s*[-–—]\s*N([\d,]+)(?:\.00)?\s*(?:\n|$)/);
  if (range) out.nationalRangePerKg = [parseFloat(range[1].replace(",", "")), parseFloat(range[2].replace(",", ""))];
  return out;
}

/** LPG market section: supply mt/day, retail range, consumption mt/day. */
function parseLpgMarketSection(text: string) {
  const w = sectionWindow(text, /LPG Market &?\s*Domestic\s*\n?\s*Supply/, 500);
  if (!w) return null;
  const supply = search(w, /([\d,]+)\s*mt\/day/);
  const range = w.match(/N([\d,]+)\s*[-–—]\s*N([\d,]+)/);
  const cMatch = w.match(/\n[A-Za-z]+ \d{4}\s*\n([\d,]+)\s*mt\/day/);
  const rangePerKg: [number, number] | null = range
    ? [parseFloat(range[1].replace(",", "")), parseFloat(range[2].replace(",", ""))]
    : null;
  return {
    supplyMtPerDay: num(supply),
    consumptionMtPerDay: cMatch ? num(cMatch[1]) : null,
    rangePerKg,
  };
}

/** Modular refineries: per-unit (utilization%, AGO domestic ML/d) + total. */
function parseModular(text: string) {
  const units: { name: "waltersmith" | "edo" | "aradel" | "opac" | "duport"; utilizationPct: number | null; agoDomesticMld: number | null }[] = [];
  const compact = text.replace(/\s+/g, "");
  for (const [name, key] of [
    ["waltersmith", "WalterSmith"],
    ["edo", "EdoRefinery"],
    ["aradel", "Aradel"],
  ] as const) {
    const m = compact.match(new RegExp(`${key}(\\d{1,3}\\.\\d{2})(\\d{1,3}\\.\\d{3})(\\d{1,3}\\.\\d{3})`));
    if (m) units.push({ name, utilizationPct: parseFloat(m[1]), agoDomesticMld: parseFloat(m[3]) });
  }
  if (units.length === 0) {
    const re = /Capacity utilization[:\s]*([\d.]+)\s*%?\)?[\s\S]{0,80}?Average AGO supply is ([\d.]+)\s*million litres\/day/g;
    let m: RegExpExecArray | null;
    const order = ["waltersmith", "edo", "aradel"] as const;
    let i = 0;
    while ((m = re.exec(text)) && i < 3) {
      units.push({ name: order[i], utilizationPct: parseFloat(m[1]), agoDomesticMld: parseFloat(m[2]) });
      i++;
    }
  }
  if (/OPAC[\s\S]{0,140}?(Shut down|Not on production|Not producing)/.test(text)) {
    units.push({ name: "opac", utilizationPct: null, agoDomesticMld: null });
  }
  const total =
    search(text, /supplied an average of ([\d.]+)\s*million litres\/day/) ??
    search(text, /three modular refineries[\s\S]{0,80}?averaged ([\d.]+)/) ??
    search(text, /Total average ([\d.]+)\s*million litres\/day/);
  return { units, totalAgoDomesticMld: num(total) };
}

/** Gas section (total, NLNG, domestic, sectoral — Bscf/day). */
function lastWindow(text: string, heading: RegExp, span: number): string | null {
  let idx = -1;
  for (const m of text.matchAll(new RegExp(heading.source, "g"))) idx = m.index!;
  if (idx < 0) return null;
  const hm = text.slice(idx, idx + 200).match(heading);
  const len = hm ? hm[0].length : 0;
  return text.slice(idx + len, idx + len + span);
}

const GAS_UNIT = /([\d.]+)\s*(?:B.?scf|Bcf)\/day/;

function parseGas(text: string) {
  const totalW = lastWindow(text, /Av\. Daily Gas supply \(Total\)/, 120);
  const total = totalW ? search(totalW, GAS_UNIT) : null;
  // values follow the (last) "Total Gas Supplied" label — NLNG first, domestic second
  let tgIdx = -1;
  for (const m of text.matchAll(/Total Gas Supplied/g)) tgIdx = m.index!;
  const afterTg = tgIdx >= 0 ? text.slice(tgIdx, tgIdx + 220) : null;
  const tgVals = afterTg ? floats(afterTg, 3).slice(0, 2) : [];
  const nlng = tgVals[0] ?? null;
  const domestic = tgVals[1] ?? null;
  const sectorW = lastWindow(text, /Sectoral Gas Utilization/, 320);
  const sector = sectorW ? floats(sectorW.slice(0, 260), 3).slice(0, 3) : [];
  return {
    totalBscfPerDay: num(total),
    nlngBscfPerDay: nlng,
    domesticBscfPerDay: domestic,
    toPowerBscfPerDay: sector[0] ?? null,
    toCommercialBscfPerDay: sector[1] ?? null,
    toIndustriesBscfPerDay: sector[2] ?? null,
  };
}

/* ---------------------- embedded statistics table (May) --------------------- */
/* The May/June/July 2026 sheets embed a clean "Midstream and Downstream
 * Statistics — May 2026" table comparing April 2026 (col A) vs May 2026
 * (col B). Layout notes (verified against extracted text):
 *   - single-product rows are row-major [Apr, May]
 *   - the AGO/ATK consumption block and the PMS/AGO stock block are
 *     product-paired: [AGO Apr, ATK Apr, AGO May, ATK May] /
 *     [PMS Apr, AGO Apr, PMS May, AGO May]
 *   - some values are concatenated without separators ("0.6120.578")         */

interface EmbeddedRows {
  crude: [number, number] | null;
  pmsSupply: [number, number] | null;
  pmsDom: [number, number] | null;
  pmsImp: [number, number] | null;
  agodSupply: [number, number] | null;
  agodDom: [number, number] | null;
  lpgSupply: [number, number] | null;
  atkSupply: [number, number] | null;
  pmsCons: [number, number] | null;
  agodCons: [number, number] | null;
  atkCons: [number, number] | null;
  lpgCons: [number, number] | null;
  pmsStock: [number, number] | null;
  agodStock: [number, number] | null;
  gas: [number, number] | null;
}

function parseEmbeddedStats(text: string): { monthA: string; monthB: string; rows: EmbeddedRows } | null {
  const head = text.match(/Midstream and Downstream Statistics\s*\n\s*(\w+) (\d{4})/);
  if (!head) return null;
  const w = text.slice(head.index! + head[0].length, head.index! + head[0].length + 2400);
  const mnames = "(January|February|March|April|May|June|July|August|September|October|November|December)";
  const pm = w.match(new RegExp(`${mnames}\\s*(\\d{4})\\s*${mnames}\\s*(\\d{4})`));
  if (!pm) return null;
  const win = (label: string, span = 140) => sectionWindow(w, new RegExp(label), span);
  const pair2 = (s: string | null, re: RegExp): [number, number] | null => {
    if (!s) return null;
    const m = s.match(re);
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
  };
  const crudeW = win("Crude receipt by domestic refineries");
  const pmsW = win("PMS Daily Supply", 260);
  const agodW = win("AGO Daily Supply", 200);
  const lpgW = win("LPG Supply", 200);
  const atkW = win("ATK Supply", 120);
  const pmsCW = win("PMS Consumption", 120);
  const agoAtkW = win("AGO Consumption", 160);
  const lpgCW = win("LPG Consumption", 120);
  const stockW = win("PMS Stock Suf.?iciency", 160);
  const gasW = win("Domestic Gas Supply", 120);

  const f = (s: string | null, n: number) => (s ? floats(s, 2).slice(0, n) : []);

  const rows: EmbeddedRows = {
    crude: pair2(crudeW, /(\d\.\d{3})(\d\.\d{3})/),
    pmsSupply: pair2(pmsW, /(\d{2}\.\d)(\d{2}\.\d)/),
    pmsDom: pair2(pmsW, /\(a\)\s*Domestic[\s\S]{0,80}?(\d{2}\.\d{1,2})(\d{2}\.\d{1,2})/),
    pmsImp: pair2(pmsW, /\(b\)\s*Import[\s\S]{0,80}?(\d\.\d{1,2})(\d\.\d{1,2})/),
    agodSupply: pair2(agodW, /(\d{2}\.\d)(\d{2}\.\d)/),
    agodDom: pair2(agodW, /\(a\)\s*Domestic[\s\S]{0,60}?\(b\)\s*Import[\s\S]{0,140}?(\d{1,2}\.\d{1,2})\s*(\d{1,2}\.\d{1,2})/),
    lpgSupply: pair2(lpgW, /(\d\.\d{1,2})(\d\.\d{1,2})/),
    atkSupply: pair2(atkW, /(\d\.\d{1,2})(\d\.\d{1,2})/),
    pmsCons: pair2(pmsCW, /(\d{2}\.\d)(\d{2}\.\d)/),
    agodCons: null,
    atkCons: null,
    lpgCons: pair2(lpgCW, /(\d\.\d{1,2})(\d\.\d{1,2})/),
    pmsStock: null,
    agodStock: null,
    gas: pair2(gasW, /(\d\.\d{3})(\d\.\d{3})/),
  };
  // paired blocks: [AGO Apr, ATK Apr, AGO May, ATK May] / [PMS Apr, AGO Apr, PMS May, AGO May]
  const aa = f(agoAtkW, 4);
  if (aa.length === 4) {
    rows.agodCons = [aa[0], aa[2]];
    rows.atkCons = [aa[1], aa[3]];
  }
  const st = f(stockW, 4);
  if (st.length === 4) {
    rows.pmsStock = [st[0], st[2]];
    rows.agodStock = [st[1], st[3]];
  }
  return { monthA: monthKey(pm[1], parseInt(pm[2], 10)), monthB: monthKey(pm[3], parseInt(pm[4], 10)), rows };
}

/**
 * DPRP: utilization (±60 chars around "Average Capacity Utilization"),
 * production/supply/export tables ("PMS53.610.640.717.1" style, Apr/May) or
 * narrative "Actual average domestic supply" (Jan–Mar).
 */
function parseDprp(text: string) {
  const out: Partial<NmdpraMonth["dprp"]> = {};
  const uIdx = text.indexOf("Average Capacity Utilization");
  if (uIdx >= 0) {
    const around = text.slice(Math.max(0, uIdx - 60), uIdx + 60);
    const um = around.match(/([\d.]+)%/);
    if (um) out.utilizationPct = parseFloat(um[1]);
  }
  const peak = text.match(/peaked at ([\d.]+)%|maximum of ([\d.]+)% utilization/);
  if (peak) out.peakUtilizationPct = parseFloat(peak[1] ?? peak[2] ?? "");
  const compact = text.replace(/\s+/g, "");
  const fourOrThree = /(\d{1,2}\.\d)(\d{1,2}\.\d)(\d{1,2}\.\d{1,2})(\d{1,2}\.\d{1,2})?/;
  const two = /(\d{1,2}\.\d{1,2})(\d{1,2}\.\d{1,2})/;
  const pm = compact.match(new RegExp(`PMS${fourOrThree}`)) ?? compact.match(new RegExp(`PMS${two}`));
  if (pm) {
    if (pm.length >= 4 && pm[4] != null) {
      out.pmsProductionMld = parseFloat(pm[1]);
      out.pmsDomesticSupplyMld = parseFloat(pm[3]);
      out.pmsExportMld = parseFloat(pm[4]);
    } else if (pm[3] != null) {
      out.pmsProductionMld = parseFloat(pm[1]);
      out.pmsDomesticSupplyMld = parseFloat(pm[3]);
    } else {
      out.pmsProductionMld = parseFloat(pm[1]);
      out.pmsDomesticSupplyMld = parseFloat(pm[2]);
    }
  } else {
    const d = search(text, /PMS Supply Performance[\s\S]{0,300}?Average domestic supply[\s\S]{0,80}?([\d.]+)\s*million litres\/day/);
    if (d) out.pmsDomesticSupplyMld = parseFloat(d);
  }
  const am = compact.match(new RegExp(`AGO${fourOrThree}`));
  if (am) {
    if (am[4] != null) {
      out.agoProductionMld = parseFloat(am[1]);
      out.agoDomesticSupplyMld = parseFloat(am[3]);
      out.agoExportMld = parseFloat(am[4]);
    } else if (am[3] != null) {
      out.agoProductionMld = parseFloat(am[1]);
      out.agoDomesticSupplyMld = parseFloat(am[3]);
    }
  }
  const tm = compact.match(new RegExp(`ATK${fourOrThree}`));
  if (tm) {
    if (tm[4] != null) {
      out.atkProductionMld = parseFloat(tm[1]);
      out.atkDomesticSupplyMld = parseFloat(tm[3]);
      out.atkExportMld = parseFloat(tm[4]);
    } else if (tm[3] != null) {
      out.atkProductionMld = parseFloat(tm[1]);
      out.atkDomesticSupplyMld = parseFloat(tm[3]);
    }
  }
  return out;
}

/* ----------------------------------- main ---------------------------------- */

const GENERATED_AT = new Date().toISOString();

const embeddedStatsByMonth = new Map<string, EmbeddedRows>();

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("1/5 Listing NMDPRA fact-sheet container…");
  const blobs = await listFactSheets();
  console.log(`   ${blobs.length} PDFs in container`);

  console.log("2/5 Downloading + extracting text…");
  const sheets: { blob: BlobEntry; text: string; month: { name: string; year: number } | null }[] = [];
  for (const b of blobs) {
    const fn = b.url.split("/").pop()!;
    const cache = path.join(CACHE_DIR, fn);
    if (!existsSync(cache)) {
      const res = await fetch(b.url);
      if (!res.ok) {
        console.warn(`   skip ${fn} (HTTP ${res.status})`);
        continue;
      }
      writeFileSync(cache, Buffer.from(await res.arrayBuffer()));
    }
    const { text } = await pdfParse(readFileSync(cache));
    const month = detectMonth(norm(text));
    sheets.push({ blob: b, text: norm(text), month });
    console.log(`   ${fn.slice(7, 19)}… → ${month ? `${month.name} ${month.year}` : "(no month — skipped)"}`);
  }

  const byMonth = new Map<string, (typeof sheets)[number]>();
  for (const s of sheets) {
    if (!s.month) continue;
    const k = monthKey(s.month.name, s.month.year);
    const existing = byMonth.get(k);
    if (!existing || existing.blob.modified < s.blob.modified) byMonth.set(k, s);
  }
  const months = [...byMonth.values()].sort((a, b) =>
    monthKey(a.month!.name, a.month!.year).localeCompare(monthKey(b.month!.name, b.month!.year)),
  );

  console.log(`3/5 Parsing ${months.length} months…`);
  const parsed: NmdpraMonth[] = [];
  const pmsPriceMonths: PmsPriceMonth[] = [];
  const lpgPriceMonths: LpgPriceMonth[] = [];

  for (const s of months) {
    const { name: month, year } = s.month!;
    const key = monthKey(month, year);
    const t = s.text;

    const cons = parseConsumption(t);
    const suff = parseSufficiency(t);
    const dprp = parseDprp(t);
    const mod = parseModular(t);
    const lpg = parseLpgMarketSection(t);
    const gas = parseGas(t);

    const m: NmdpraMonth = {
      month: key,
      label: `${month} ${year}`,
      sourceUrl: s.blob.url,
      releasedAt: s.blob.modified,
      dprp: {
        utilizationPct: dprp.utilizationPct ?? null,
        peakUtilizationPct: dprp.peakUtilizationPct ?? null,
        pmsProductionMld: dprp.pmsProductionMld ?? null,
        pmsDomesticSupplyMld: dprp.pmsDomesticSupplyMld ?? null,
        pmsExportMld: dprp.pmsExportMld ?? null,
        agoProductionMld: dprp.agoProductionMld ?? null,
        agoDomesticSupplyMld: dprp.agoDomesticSupplyMld ?? null,
        agoExportMld: dprp.agoExportMld ?? null,
        atkProductionMld: dprp.atkProductionMld ?? null,
        atkDomesticSupplyMld: dprp.atkDomesticSupplyMld ?? null,
        atkExportMld: dprp.atkExportMld ?? null,
      },
      modular: { totalAgoDomesticMld: mod.totalAgoDomesticMld, units: mod.units },
      supply: {
        pmsTotalMld: null, pmsDomesticMld: null, pmsImportMld: null,
        agodTotalMld: null, agodDomesticMld: null, agodImportMld: null,
        atkMld: null, lpgKtPerDay: null, crudeMbd: null,
      },
      consumption: {
        pmsMld: cons?.pmsMld ?? null,
        agodMld: cons?.agodMld ?? null,
        atkMld: cons?.atkMld ?? null,
        lpgKtPerDay: cons?.lpgKtPerDay ?? null,
      },
      sufficiencyDays: suff ?? { pms: null, agod: null, atk: null, lpg: null, includesDprpStock: null },
      lpg: { supplyMtPerDay: lpg?.supplyMtPerDay ?? null, consumptionMtPerDay: lpg?.consumptionMtPerDay ?? null },
      gas: {
        totalBscfPerDay: gas.totalBscfPerDay,
        nlngBscfPerDay: gas.nlngBscfPerDay,
        domesticBscfPerDay: gas.domesticBscfPerDay,
        toPowerBscfPerDay: gas.toPowerBscfPerDay,
        toCommercialBscfPerDay: gas.toCommercialBscfPerDay,
        toIndustriesBscfPerDay: gas.toIndustriesBscfPerDay,
      },
      benchmark: { pmsMld: 50, agodMld: 14, atkMld: 3, lpgKtPerDay: 3.9 },
      notes: [],
    };

    // National supply ("1. Daily Average Receipt/Supply of key Petroleum Products")
    const supW = sectionWindow(t, /[12]\.\s*Daily Average (Receipt|Supply) of key Petroleum[\s\S]{0,300}?/, 300);
    if (supW) {
      const vals: number[] = [];
      const re = /([\d.]+)\s*(?:ML|KT)\/day/g;
      let mm: RegExpExecArray | null;
      while ((mm = re.exec(supW)) && vals.length < 4) vals.push(parseFloat(mm[1]));
      if (vals.length === 4) {
        m.supply.pmsTotalMld = vals[0];
        m.supply.agodTotalMld = vals[1];
        m.supply.atkMld = vals[2];
        m.supply.lpgKtPerDay = vals[3];
      }
    }

    // Embedded statistics table → authoritative values for months A & B
    const stats = parseEmbeddedStats(t);
    if (stats) {
      embeddedStatsByMonth.set(stats.monthA, stats.rows);
      embeddedStatsByMonth.set(stats.monthB, stats.rows);
      embeddedColumn[stats.monthA] = 0;
      embeddedColumn[stats.monthB] = 1;
      m.notes.push(`Sheet embeds the "${stats.monthA} → ${stats.monthB}" statistics table (used as primary source for those months).`);
    }

    // PMS price table
    const prices = parsePmsPriceTable(t, s.blob.url);
    if (prices) {
      if (prices.period < key) prices.notes.push("Price table as reprinted in this sheet (period earlier than sheet month).");
      if (!pmsPriceMonths.some((p) => p.period === prices.period)) pmsPriceMonths.push(prices);
    }

    // LPG prices
    const lpgP = parseLpgPrice(t);
    const lpgEntry: LpgPriceMonth = {
      period: key,
      label: `${month} ${year}`,
      sourceUrl: s.blob.url,
      nationalRangePerKg: lpg?.rangePerKg ?? lpgP.nationalRangePerKg ?? null,
      states: lpgP.states ?? null,
      notes: [],
    };
    if (lpgEntry.nationalRangePerKg || lpgEntry.states) lpgPriceMonths.push(lpgEntry);

    parsed.push(m);
  }

  // apply embedded statistics table values (authoritative for Apr/May 2026)
  for (const [key, rows] of embeddedStatsByMonth) {
    const target = parsed.find((x) => x.month === key);
    if (!target) continue;
    applyEmbedded(target, rows, colFor(key, rows));
  }

  // curated Oct 2025 PMS prices (old-format sheet, 7 states — no S/NODESCRIPTION table)
  pmsPriceMonths.unshift({
    period: "2025-10",
    label: "October 2025",
    sourceUrl: "https://alps.blob.core.windows.net/nmdprawebsite/Statistics/Upload-80c82709-7f84-4cea-959e-668d6e6d030e.pdf",
    nfemRatePerUsd: null,
    brentUsdPerBarrel: null,
    gasolineUsdPerMt: null,
    states: [
      { state: "lagos", indicativePerLitre: 914.5, maxActualPerLitre: null, minActualPerLitre: null, avgActualPerLitre: null },
      { state: "abuja", indicativePerLitre: 947.0, maxActualPerLitre: null, minActualPerLitre: null, avgActualPerLitre: null },
      { state: "kano", indicativePerLitre: 980.0, maxActualPerLitre: null, minActualPerLitre: null, avgActualPerLitre: null },
      { state: "calabar", indicativePerLitre: 927.0, maxActualPerLitre: null, minActualPerLitre: null, avgActualPerLitre: null },
      { state: "sokoto", indicativePerLitre: 982.0, maxActualPerLitre: null, minActualPerLitre: null, avgActualPerLitre: null },
      { state: "maiduguri", indicativePerLitre: 985.0, maxActualPerLitre: null, minActualPerLitre: null, avgActualPerLitre: null },
      { state: "ibadan", indicativePerLitre: 930.0, maxActualPerLitre: null, minActualPerLitre: null, avgActualPerLitre: null },
      { state: "enugu", indicativePerLitre: null, maxActualPerLitre: null, minActualPerLitre: null, avgActualPerLitre: null },
    ],
    notes: ["Old-format sheet: indicative pump prices only (no max/min/avg rows); Enugu not published."],
  });
  pmsPriceMonths.sort((a, b) => a.period.localeCompare(b.period));

  // apply manual overrides (transcribed from the same PDFs)
  for (const [key, ov] of Object.entries(MANUAL_OVERRIDES)) {
    const target = parsed.find((x) => x.month === key);
    if (!target) {
      console.warn(`   override for ${key} has no parsed month — skipping`);
      continue;
    }
    applyOverride(target, ov);
  }

  console.log("4/5 Validating against @fuellink/contracts…");
  const dataset = NmdpraDatasetSchema.parse({
    generatedAt: GENERATED_AT,
    source: {
      name: "Nigerian Midstream and Downstream Petroleum Regulatory Authority (NMDPRA)",
      description: "Monthly 'State of the Midstream and Downstream Sector' fact sheets, parsed from official PDFs.",
      containerListUrl: "https://alps.blob.core.windows.net/nmdprawebsite?restype=container&comp=list&prefix=Statistics/",
      site: "https://nmdpra.gov.ng/",
    },
    months: parsed,
    pipelineProgress: PIPELINE_PROGRESS,
  });
  const pmsPrices = PmsPriceDatasetSchema.parse({
    generatedAt: GENERATED_AT,
    source: "NMDPRA fact sheets — 'Indicative Fuel Prices' tables (PMS pump prices, 8 states).",
    months: pmsPriceMonths,
  });
  const lpgPrices = LpgPriceDatasetSchema.parse({
    generatedAt: GENERATED_AT,
    source: "NMDPRA fact sheets — LPG retail price monitor + national range lines.",
    months: lpgPriceMonths,
  });
  const lome = LomeDatasetSchema.parse(buildLomeDataset(parsed));
  const gantry = GantryDatasetSchema.parse(buildGantryDataset(pmsPriceMonths));
  const lpgMarket = LPG_MARKET;
  const jet = JET_A1;
  void LpgMarketDatasetSchema.parse(lpgMarket);
  void JetDatasetSchema.parse(jet);

  console.log("5/5 Writing datasets…");
  const write = (file: string, data: unknown) => {
    writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2) + "\n");
    console.log(`   wrote src/data/intelligence/${file}`);
  };
  write("nmdpra-monthly.json", dataset);
  write("pms-prices.json", pmsPrices);
  write("lpg-prices.json", lpgPrices);
  write("lome-index.json", lome);
  write("gantry-prices.json", gantry);
  write("lpg-market.json", lpgMarket);
  write("jet-a1.json", jet);

  console.log(`Done. ${parsed.length} months: ${parsed[0]?.label} → ${parsed[parsed.length - 1]?.label}`);
}

/** Column index for a month within the embedded statistics table (A=0, B=1). */
const embeddedColumn: Record<string, 0 | 1> = {};
function colFor(key: string, _rows: EmbeddedRows): 0 | 1 {
  // monthA = col 0, monthB = col 1 — recorded when the table is parsed
  return embeddedColumn[key] ?? 0;
}
function applyEmbedded(m: NmdpraMonth, rows: EmbeddedRows, col: 0 | 1) {
  const g = (r: [number, number] | null) => (r ? r[col] : null);
  if (rows.pmsSupply) m.supply.pmsTotalMld = g(rows.pmsSupply) ?? m.supply.pmsTotalMld;
  if (rows.pmsDom) m.supply.pmsDomesticMld = g(rows.pmsDom);
  if (rows.pmsImp) m.supply.pmsImportMld = g(rows.pmsImp);
  if (rows.agodSupply) m.supply.agodTotalMld = g(rows.agodSupply) ?? m.supply.agodTotalMld;
  if (rows.agodDom) m.supply.agodDomesticMld = g(rows.agodDom);
  if (rows.lpgSupply) m.supply.lpgKtPerDay = g(rows.lpgSupply) ?? m.supply.lpgKtPerDay;
  if (rows.atkSupply) m.supply.atkMld = g(rows.atkSupply) ?? m.supply.atkMld;
  if (rows.crude) m.supply.crudeMbd = g(rows.crude);
  if (rows.pmsCons) m.consumption.pmsMld = g(rows.pmsCons) ?? m.consumption.pmsMld;
  if (rows.agodCons) m.consumption.agodMld = g(rows.agodCons) ?? m.consumption.agodMld;
  if (rows.atkCons) m.consumption.atkMld = g(rows.atkCons) ?? m.consumption.atkMld;
  if (rows.lpgCons) m.consumption.lpgKtPerDay = g(rows.lpgCons) ?? m.consumption.lpgKtPerDay;
  if (rows.pmsStock) m.sufficiencyDays.pms = g(rows.pmsStock) ?? m.sufficiencyDays.pms;
  if (rows.agodStock) m.sufficiencyDays.agod = g(rows.agodStock) ?? m.sufficiencyDays.agod;
  if (rows.gas) m.gas.totalBscfPerDay = g(rows.gas) ?? m.gas.totalBscfPerDay;
}

/* ------------------------- curated (non-PDF) datasets ----------------------- */
/* Each value below is a real published figure with its source. No estimates.   */

const LPG_MARKET: Tlpg = {
  generatedAt: GENERATED_AT,
  demandMt: { value: 1_800_000, year: 2026, source: "NUPRC / NALPGAM 2026 outlook, as reported by Vanguard & Legit (2026)" },
  supplyMt: { min: 1_550_000, max: 1_650_000, year: 2026, source: "NUPRC / NMDPRA, as reported by Vanguard & Legit (2026)" },
  bufferDays: { value: 5, source: "NMDPRA fact sheets (national LPG days-of-sufficiency, Oct 2025 sheet)" },
  pricePerKgHistory: [
    { year: 2016, nairaPerKg: 400 },
    { year: 2026, nairaPerKg: 2000 },
  ],
  exportSharePct: { value: 62, source: "Share of Nigeria's gas output exported (2026), as reported" },
  producers: ["Dangote (DPRP)", "NLNG", "Kwale", "Ologbo", "Pan Ocean", "Seplat", "PNG Gas", "Greenville", "LPG import terminals"],
  policyNote:
    "Federal Government directive: domestic LPG consumption takes priority over export; refinery LPG evacuation queues ran ~4x coastal-terminal times during shortage periods.",
};

const JET_A1: Tjet = {
  generatedAt: GENERATED_AT,
  timeline: [
    { date: "2026-02", nairaPerLitre: 900, nairaPerLitreHigh: null, source: "AON / AirInsight / ThisDay / Legit (2026 jet A-1 crisis coverage)", note: "Pre-crisis level" },
    { date: "2026-04", nairaPerLitre: 3300, nairaPerLitreHigh: null, source: "AON / AirInsight / ThisDay / Legit (2026 jet A-1 crisis coverage)", note: "Peak of the crisis; AON threatened to cease operations on 20 Apr 2026" },
    { date: "2026-09", nairaPerLitre: 1550, nairaPerLitreHigh: 2150, source: "AON / AirInsight / ThisDay / Legit (Jun–Sep 2026)", note: "Stabilised range; wide per-airport spreads persist" },
  ],
  dprpPricingModel: {
    currency: "USD",
    priceHoldbackPct: 25,
    note: "DPRP sells jet A-1 ex-gantry in USD with a 25% price holdback — the model FuelLink's forward/holdback mechanics mirror.",
  },
  airportSpreadExample: { airport: "Abuja (ABV)", minPerLitre: 1190, maxPerLitre: 2150, source: "AirInsight / ThisDay (2026) — 18+ jet marketers quoting wide per-airport spreads" },
  context: [
    "Jet fuel ≈ 40% of Nigerian airline operating costs.",
    "Nigerian jet fuel prices ran ~17% above the global average during 2026.",
    "Airlines pay slowly → receivables risk → airline-receivables factoring is the obvious finance product (L4).",
  ],
};

const PIPELINE_PROGRESS = [
  {
    asOf: "2026-01",
    label: "January 2026 (NGIC, via NMDPRA fact sheet)",
    akkPct: 77.9,
    ob3OverallPct: 99.9,
    ob3NigerCrossingPct: 56.35,
    odidiWarriPct: 66.76,
    escravosOdidiPct: 10.54,
    elpsMidlinePct: 92.7,
    overallPct: 69.67,
    sourceUrl: "https://alps.blob.core.windows.net/nmdprawebsite/Statistics/Upload-2a9129c4-5631-4569-83ee-d8d8234cda6f.pdf",
  },
  {
    asOf: "2026-06",
    label: "June 2026 (NGIC, via NMDPRA fact sheet)",
    akkPct: 94.3,
    ob3OverallPct: 96,
    ob3NigerCrossingPct: 100,
    odidiWarriPct: 74.58,
    escravosOdidiPct: 23.69,
    elpsMidlinePct: 95.41,
    overallPct: null,
    sourceUrl: "https://alps.blob.core.windows.net/nmdprawebsite/Statistics/Upload-137a2554-2f1b-4fb4-aa7b-84fc7bf53ec6.pdf",
  },
];

/* --------- manual overrides: values transcribed from the same PDFs ---------- */

type Override = {
  dprp?: Partial<NmdpraMonth["dprp"]>;
  supply?: Partial<NmdpraMonth["supply"]>;
  sufficiencyDays?: Partial<NmdpraMonth["sufficiencyDays"]>;
  lpg?: Partial<NmdpraMonth["lpg"]>;
  gas?: Partial<NmdpraMonth["gas"]>;
  modular?: Partial<NmdpraMonth["modular"]>;
  notes?: string[];
};

const MANUAL_OVERRIDES: Record<string, Override> = {
  "2025-10": {
    sufficiencyDays: { pms: 11, agod: 38, atk: 15, lpg: 5, includesDprpStock: null },
    lpg: { supplyMtPerDay: 5700, consumptionMtPerDay: 4410 },
    notes: [
      "Sheet system-wide utilization 61.58% (4 active refineries, 467,000 bpd of 1,125,000 bpd installed); DPRP not separately reported in Oct 2025 sheet.",
      "Sheet lists two sufficiency blocks: 'Fuel Sufficiency Levels' 14/41/18/4/48 days and 'National Fuel Sufficiency' 11/38/15/5/49 days (both labelled Oct 2025). National block used.",
      "LPG consumption peak 6,711 mt/day (Aug 2025) reported in sheet.",
    ],
  },
  "2025-11": {
    dprp: { pmsDomesticSupplyMld: 23.52 },
    notes: [
      "DPRP PMS average domestic evacuation 23.52 ML/day (Nov 2025 sheet); AGO evacuation of prior stock 0.349 ML/day.",
      "Consumption value order in sheet is PMS/AGO/LPG/ATK; parser maps by unit.",
    ],
  },
  "2025-12": {
    supply: { pmsTotalMld: 74.2 },
    dprp: { utilizationPct: 62.94, peakUtilizationPct: 71, pmsDomesticSupplyMld: 32.012, agoDomesticSupplyMld: 5.783 },
    notes: [
      "Highlight block: PMS total supply 74.2 ML/D, DPRP PMS 32.01 ML/D, PMS sufficiency 29.2 days, LPG domestic supply 5.2 KT/day.",
      "DPRP PMS supply improved from 19.5 ML/day (Nov) to 32 ML/day (Dec) per sheet note.",
    ],
  },
  "2026-01": {
    supply: { pmsTotalMld: 64.9, pmsImportMld: 24.8 },
    dprp: { utilizationPct: 61.27, peakUtilizationPct: 67.69, pmsDomesticSupplyMld: 40.1, agoDomesticSupplyMld: 10.9 },
    notes: [
      "PMS total supply 64.9 ML/D from highlights; import 24.8 = 64.9 − 40.1 (derived, arithmetic only).",
      "Sufficiency excludes DPRP PMS stock earmarked for domestic market (sheet note).",
      "Sheet reprints the Nov 2025 PMS price table (used as the 2025-11 price month source).",
    ],
  },
  "2026-02": {
    supply: { pmsTotalMld: 39.6, pmsDomesticMld: 36.6, pmsImportMld: 3.0 },
    dprp: { utilizationPct: 78.13, pmsDomesticSupplyMld: 36.5, agoDomesticSupplyMld: 8.2 },
    notes: [
      "PMS total 39.6 ML/D from highlights (Jan 64.9 − 25.4 MoM reduction per sheet note); import 3.0 = 39.6 − 36.6 (derived, arithmetic only).",
      "Sufficiency includes gross PMS stock at DPRP (sheet note).",
    ],
  },
  "2026-03": {
    dprp: { utilizationPct: 93.62, pmsProductionMld: 48.2, pmsDomesticSupplyMld: 34.2, agoProductionMld: 16.5, agoDomesticSupplyMld: 2.2 },
    notes: ["Sufficiency includes pumpable stock at Dangote Refinery (sheet note)."],
  },
  "2026-04": {
    dprp: {
      utilizationPct: 99.12,
      pmsProductionMld: 53.6, pmsDomesticSupplyMld: 40.7, pmsExportMld: 17.1,
      agoProductionMld: 23.6, agoDomesticSupplyMld: 8.0, agoExportMld: 17.8,
      atkProductionMld: 22.9, atkDomesticSupplyMld: 2.6, atkExportMld: 20.5,
    },
    notes: ["Dangote refinery ran at ~100% capacity utilization for most days in April (sheet note)."],
  },
  "2026-05": {
    dprp: {
      utilizationPct: 101.25,
      pmsProductionMld: 44.7, pmsDomesticSupplyMld: 41.5,
      agoProductionMld: 24.5, agoDomesticSupplyMld: 18.2, agoExportMld: 6.5,
      atkProductionMld: 21.9, atkDomesticSupplyMld: 2.8, atkExportMld: 17.5,
    },
    notes: [
      "May sheet's 'Daily Average Supply' shows ATK 19.2 ML/day — contradicted by the sheet's own embedded statistics table (3.6 ML/day); statistics table value used.",
    ],
  },
  "2026-06": {
    dprp: { utilizationPct: 101.36 },
    supply: { pmsImportMld: 18.1 },
    notes: [
      "PMS imports 18.1 ML/day (+207% MoM) and domestic PMS supply ~32.5 ML/day per NMDPRA June 2026 data as reported (Megastar, 18 Jul 2026).",
    ],
  },
  "2026-07": {
    dprp: { utilizationPct: 71.09 },
    notes: ["July sheet carries NMDPRA editorial QA comments in the PDF (draft-stage quality); figures as printed."],
  },
};

function applyOverride(m: NmdpraMonth, ov: Override) {
  const merge = (dst: Record<string, unknown>, src: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(src)) {
      if (v != null) dst[k] = v;
    }
  };
  if (ov.dprp) merge(m.dprp as Record<string, unknown>, ov.dprp);
  if (ov.supply) merge(m.supply as Record<string, unknown>, ov.supply);
  if (ov.sufficiencyDays) merge(m.sufficiencyDays as Record<string, unknown>, ov.sufficiencyDays);
  if (ov.lpg) merge(m.lpg as Record<string, unknown>, ov.lpg);
  if (ov.gas) merge(m.gas as Record<string, unknown>, ov.gas);
  if (ov.modular) merge(m.modular as Record<string, unknown>, ov.modular);
  if (ov.notes) m.notes.push(...ov.notes);
}

/* ------------------------- Lomé + gantry (derived) -------------------------- */

function buildLomeDataset(months: NmdpraMonth[]): LomeDataset {
  const monthly = months
    .filter((m) => m.month >= "2026-01")
    .map((m) => ({
      month: m.month,
      label: m.label,
      pmsImportMld: m.supply.pmsImportMld,
      pmsExportMld: m.dprp.pmsExportMld,
      atkExportMld: m.dprp.atkExportMld,
      agodExportMld: m.dprp.agoExportMld,
      sourceUrl: m.sourceUrl,
    }))
    .filter((m) => m.pmsImportMld != null || m.pmsExportMld != null || m.atkExportMld != null || m.agodExportMld != null);
  return {
    generatedAt: GENERATED_AT,
    paradox: {
      title: "The Lomé paradox",
      statement:
        "An estimated 70–80% of Nigeria's waterborne fuel 'imports' in Mar–May 2026 were Dangote Refinery product shipped out via Lomé (Togo) and re-imported into Lagos — circular trade driven by FX structure, pricing and port capacity.",
      period: "Mar–May 2026",
      shareRange: [70, 80],
      source: "S&P Global Commodity Insights, via MEMAN industry webinar (2026)",
    },
    monthly,
    nbsQ1Exports: {
      period: "Q1 2026",
      items: [
        { product: "Petroleum (gas oil / AGO)", destination: "All destinations", nairaBillion: 278.36 },
        { product: "Jet fuel (ATK)", destination: "All destinations", nairaBillion: 273.18 },
        { product: "Crude oil", destination: "All destinations", nairaBillion: 220.14 },
        { product: "Petrol (PMS)", destination: "Togo", nairaBillion: 105.5 },
      ],
      otherDestinations: ["Côte d'Ivoire", "Cameroon", "Tanzania", "Ghana", "Togo", "Angola", "South Africa", "Europe"],
      source: "Nigeria Bureau of Statistics, foreign trade statistics Q1 2026 (as reported)",
    },
    jetExports: {
      may2026Mt: 476_099,
      april2026PctChangeYoy: 770,
      april2026Bpd: 158_000,
      topDestination: "Europe",
      topDestinationSharePct: null,
      source: "DPRP export volumes (May 2026); S&P Global Commodity Insights via MEMAN (Apr 2026 jet export surge ~+770% to ~158k bpd; Europe largest destination)",
    },
  };
}

function buildGantryDataset(pmsPrices: PmsPriceMonth[]): GantryDataset {
  const points: GantryDataset["points"] = [];
  for (const p of pmsPrices) {
    const lagos = p.states.find((s) => s.state === "lagos")?.indicativePerLitre ?? null;
    const abuja = p.states.find((s) => s.state === "abuja")?.indicativePerLitre ?? null;
    if (lagos != null)
      points.push({ date: p.period, product: "PMS", issuer: "nmdpra_indicative_lagos", price: lagos, priceHigh: null, basis: "indicative", source: p.sourceUrl, note: null });
    if (abuja != null)
      points.push({ date: p.period, product: "PMS", issuer: "nmdpra_indicative_abuja", price: abuja, priceHigh: null, basis: "indicative", source: p.sourceUrl, note: null });
  }
  // NNPC PMS price revisions (as published, 2026) — months only where sourced
  points.push({ date: "2026", product: "PMS", issuer: "nnpc", price: 1320, priceHigh: null, basis: "indicative", source: "NNPC DRC monthly price revisions (2026), as reported", note: "Start of the 2026 correction cycle (month not itemised in source)" });
  points.push({ date: "2026", product: "PMS", issuer: "nnpc", price: 1150, priceHigh: null, basis: "indicative", source: "NNPC DRC monthly price revisions (2026), as reported", note: "Mid-correction-cycle revision (month not itemised in source)" });
  points.push({ date: "2026-07", product: "PMS", issuer: "nnpc", price: 1110, priceHigh: null, basis: "indicative", source: "NNPC price revision, July 2026 (as reported)", note: "Lowest point of the 2026 correction cycle" });
  points.push({ date: "2026-08", product: "PMS", issuer: "nmdpra_indicative_lagos", price: 1265, priceHigh: null, basis: "indicative", source: "NNPC price revision, early Aug 2026 (as reported)", note: "Rebound — Lagos" });
  points.push({ date: "2026-08", product: "PMS", issuer: "nmdpra_indicative_abuja", price: 1335, priceHigh: null, basis: "indicative", source: "NNPC price revision, early Aug 2026 (as reported)", note: "Rebound — Abuja" });
  points.push({ date: "2026", product: "PMS", issuer: "dprp", price: 1075, priceHigh: 1175, basis: "gantry", source: "DPRP ex-gantry PMS (as reported, 2026)", note: "Observed ex-gantry range ~₦1,075–1,175/L through 2026" });
  points.sort((a, b) => a.date.localeCompare(b.date));
  return {
    generatedAt: GENERATED_AT,
    description: "PMS price ladder: DPRP ex-gantry → NNPC price-revision basis → NMDPRA indicative state pump prices (Lagos/Abuja). All ₦/litre.",
    points,
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
