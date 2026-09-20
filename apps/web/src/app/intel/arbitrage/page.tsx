// /intel/arbitrage — computed signals: spreads and structural gaps,
// each one traceable to a sourced figure.

import type { Metadata } from "next";
import { IntelHeader, Note, Derived } from "@/components/intel/bits";
import { latestMonth, monthLabel, fmt, fmtNaira, nmdpra, gantry, lome, lpgMarket, jet, pmsPrices } from "@/lib/intel";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Arbitrage Signals",
  description:
    "Computed price spreads and structural gaps in the Nigerian downstream sector — gantry-to-pump, state-to-state, the LPG deficit, and jet-fuel spreads. Every signal traces to a published figure.",
};

interface Signal {
  id: string;
  title: string;
  big: string;
  detail: string;
  derivation?: string;
  source: string;
  tone: "good" | "warn" | "bad";
}

export default function ArbitragePage() {
  const latest = latestMonth();

  // --- signal 1: gantry → pump (Lagos, Apr 2026) ---
  const apr = pmsPrices.months.find((m) => m.period === "2026-04");
  const lagosApr = apr?.states.find((s) => s.state === "lagos")?.indicativePerLitre ?? null;
  const dprp = gantry.points.find((p) => p.issuer === "dprp");
  const spreadLow = lagosApr != null && dprp ? lagosApr - dprp.price : null;
  const spreadHigh = lagosApr != null && dprp?.priceHigh ? lagosApr - dprp.priceHigh : null;

  // --- signal 2: state spread (Apr 2026 actuals) ---
  const avgs = (apr?.states ?? [])
    .flatMap((s) => (s.avgActualPerLitre != null ? [{ state: s.state, v: s.avgActualPerLitre }] : []))
    .sort((a, b) => b.v - a.v);
  const stateSpread = avgs.length >= 2 ? avgs[0].v - avgs[avgs.length - 1].v : null;

  // --- signal 3: LPG deficit (2026) ---
  const gapMin = lpgMarket.demandMt.value - lpgMarket.supplyMt.max;
  const gapMax = lpgMarket.demandMt.value - lpgMarket.supplyMt.min;

  // --- signal 4: jet airport spread ---
  const jetSpread = jet.airportSpreadExample.maxPerLitre - jet.airportSpreadExample.minPerLitre;

  // --- signal 5: PMS import receipts swing ---
  const jan = lome.monthly.find((m) => m.month === "2026-01")?.pmsImportMld ?? null;
  const jun = lome.monthly.find((m) => m.month === "2026-06")?.pmsImportMld ?? null;

  // --- signal 6: price rebound ---
  const nnpcJul = gantry.points.find((p) => p.issuer === "nnpc" && p.date === "2026-07")?.price ?? null;
  const lagosAug = gantry.points.find((p) => p.date === "2026-08" && p.issuer === "nmdpra_indicative_lagos")?.price ?? null;
  const rebound = nnpcJul != null && lagosAug != null ? lagosAug - nnpcJul : null;

  const signals: Signal[] = [
    {
      id: "gantry-pump",
      title: "Gantry → pump spread (Lagos)",
      big:
        spreadLow != null && spreadHigh != null
          ? `${fmtNaira(spreadHigh)} – ${fmtNaira(spreadLow)} /L`
          : "—",
      detail:
        "Apr 2026: NMDPRA indicative Lagos pump price vs the DPRP ex-gantry band. This is the total economics of getting a litre from the refinery to the city — trucking, storage, working capital and margin all fit inside it.",
      derivation: `${lagosApr?.toLocaleString()} − (1,075–1,175)`,
      source: "NMDPRA fact sheet (Apr 2026) + DPRP ex-gantry as reported",
      tone: "warn",
    },
    {
      id: "state-spread",
      title: `State-to-state wedge (Apr 2026)`,
      big: stateSpread != null ? `${fmtNaira(stateSpread)} /L` : "—",
      detail: `Highest average actual: ${avgs[0] ? { lagos: "Lagos", abuja: "Abuja", kano: "Kano", calabar: "Calabar", sokoto: "Sokoto", maiduguri: "Maiduguri", ibadan: "Ibadan", enugu: "Enugu" }[avgs[0].state] : "—"} (${fmt(avgs[0]?.v ?? null, 0)}). Lowest: ${avgs.at(-1) ? { lagos: "Lagos", abuja: "Abuja", kano: "Kano", calabar: "Calabar", sokoto: "Sokoto", maiduguri: "Maiduguri", ibadan: "Ibadan", enugu: "Enugu" }[avgs.at(-1)!.state] : "—"} (${fmt(avgs.at(-1)?.v ?? null, 0)}). The north premium persists even after the 2026 corrections — logistics, not the barrel, is the price.`,
      derivation: "max − min of published state actuals",
      source: "NMDPRA fact sheet (Apr 2026)",
      tone: "warn",
    },
    {
      id: "lpg-deficit",
      title: "LPG structural deficit (2026)",
      big: `~${gapMin / 1000}–${gapMax / 1000}k t/yr gap`,
      detail: `Demand ${lpgMarket.demandMt.value / 1e6}M t vs supply ${lpgMarket.supplyMt.min / 1e6}–${lpgMarket.supplyMt.max / 1e6}M t, with a national buffer of only ${lpgMarket.bufferDays.value} days. Tight supply + domestic-first policy = the clearest structural squeeze in the sector.`,
      derivation: "1,800,000 − (1,550,000–1,650,000) tonnes",
      source: "NUPRC/NALPGAM 2026 outlook & NMDPRA sufficiency, as reported",
      tone: "bad",
    },
    {
      id: "jet-spread",
      title: `Jet spread — ${jet.airportSpreadExample.airport}`,
      big: `${fmtNaira(jetSpread)} /L`,
      detail: `18+ jet marketers quoting ${fmtNaira(jet.airportSpreadExample.minPerLitre)} to ${fmtNaira(jet.airportSpreadExample.maxPerLitre)} at the same airport in 2026. Wide, documented dispersion at a single point of sale is the arbitrage in one line.`,
      derivation: "2,150 − 1,190",
      source: jet.airportSpreadExample.source,
      tone: "warn",
    },
    {
      id: "jet-momentum",
      title: "Jet export momentum",
      big: `+${lome.jetExports.april2026PctChangeYoy}% YoY (Apr)`,
      detail: `April 2026 jet exports ran ~${fmt(lome.jetExports.april2026Bpd, 0)} bpd with Europe the largest destination; May volume was ${fmt(lome.jetExports.may2026Mt, 0)} MT. A fast-forming export book that most dashboards don't track.`,
      source: lome.jetExports.source,
      tone: "good",
    },
    {
      id: "import-swing",
      title: "PMS 'import' receipts swing",
      big: `${fmt(jan, 1)} → ${fmt(jun, 1)} ML/d`,
      detail:
        "NMDPRA import receipts: 24.8 ML/d (Jan) → 3.0 (Feb) → 18.1 (Jun). With 70–80% of waterborne 'imports' in Mar–May traced to DPRP product via Lomé, this series is as much an export mirror as an import series.",
      source: "NMDPRA fact sheets + S&P Global via MEMAN",
      tone: "warn",
    },
    {
      id: "rebound",
      title: "Price rebound after correction",
      big: rebound != null ? `+${fmtNaira(rebound)} /L` : "—",
      detail:
        "NNPC basis hit ₦1,110 in July; Lagos indicative was already ₦1,265 in early August. A ~₦155/L re-pricing inside weeks — the kind of move a priced-in position needs to be ready for.",
      derivation: "1,265 − 1,110 (sourced points, different issuers)",
      source: "NNPC revisions + NMDPRA indicative (as reported)",
      tone: "good",
    },
    {
      id: "sufficiency-watch",
      title: "Sufficiency watch level",
      big: `${fmt(latest.sufficiencyDays.pms, 1)} days PMS`,
      detail: `Jul 2026 PMS sufficiency ${fmt(latest.sufficiencyDays.pms, 1)} days (incl. DPRP) vs ${fmt(latest.benchmark.pmsMld, 0)} ML/d benchmark consumption. Below 14 days is where policy responses historically begin.`,
      source: "NMDPRA fact sheet (Jul 2026)",
      tone: (latest.sufficiencyDays.pms ?? 99) < 14 ? "bad" : (latest.sufficiencyDays.pms ?? 99) < 28 ? "warn" : "good",
    },
  ];

  const toneMap = {
    good: { border: "border-primary-200", bg: "from-primary-50", text: "text-primary-700" },
    warn: { border: "border-amber-200", bg: "from-amber-50", text: "text-amber-700" },
    bad: { border: "border-red-200", bg: "from-red-50", text: "text-red-700" },
  };

  return (
    <div>
      <IntelHeader
        title="Arbitrage signals"
        description="What the data is telling you right now: spreads, wedges, and structural gaps computed from the sourced datasets. Every signal shows its arithmetic and its source. These are observations, not offers."
        asOf={monthLabel(latest.month)}
      />

      <div className="mb-6">
        <Note tone="warn">
          <strong>Reading these signals.</strong> A spread only becomes a trade after your own
          freight, risk, working-capital cost, and execution friction — enter those in the{" "}
          <Link href="/intel/calculator" className="text-primary-700 hover:underline font-semibold">
            calculator
          </Link>
          . Values tagged <Derived /> are arithmetic over sourced figures; nothing here is a
          market estimate or a recommendation.
        </Note>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {signals.map((s) => {
          const t = toneMap[s.tone];
          return (
            <div
              key={s.id}
              className={`rounded-2xl border ${t.border} bg-gradient-to-br ${t.bg} to-white p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                {s.derivation && <Derived note={s.derivation} />}
              </div>
              <p className={`mt-2 text-2xl font-bold ${t.text}`}>{s.big}</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.detail}</p>
              <p className="mt-3 text-[11px] text-slate-400">Source: {s.source}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
