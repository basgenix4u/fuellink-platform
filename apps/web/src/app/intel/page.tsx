// /intel — Intelligence hub: latest snapshot + index of dashboards.

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Calculator,
  Flame,
  Fuel,
  Gauge,
  Landmark,
  Map,
  Plane,
  Scale,
} from "lucide-react";
import { IntelHeader, Metric, Note, TableShell, Th, Td } from "@/components/intel/bits";
import { latestMonth, monthBefore, monthLabel, fmt, fmtPct, nmdpra, generatedAtDate } from "@/lib/intel";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Nigeria's downstream petroleum sector in one view — DPRP output, national supply and consumption, sufficiency, and the Lomé trade paradox. Sourced from NMDPRA fact sheets, updated monthly.",
};

const DASHBOARDS: {
  href: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  accent: string;
}[] = [
  {
    href: "/intel/gantry",
    title: "Gantry Tracker",
    desc: "The PMS price ladder: DPRP ex-gantry → NNPC revisions → NMDPRA indicative state prices.",
    icon: Fuel,
    accent: "bg-primary-50 text-primary-700",
  },
  {
    href: "/intel/sufficiency",
    title: "Sufficiency Radar",
    desc: "Days of national PMS, AGO, ATK and LPG stock — and when the basis shifts.",
    icon: Gauge,
    accent: "bg-amber-50 text-amber-700",
  },
  {
    href: "/intel/lome",
    title: "Lomé Index",
    desc: "Why 70–80% of 'imports' are DPRP product returning through Togo, and what Nigeria actually exports.",
    icon: Landmark,
    accent: "bg-sky-50 text-sky-700",
  },
  {
    href: "/intel/prices",
    title: "State Price Indices",
    desc: "Indicative and actual PMS pump prices across 8 states, plus LPG retail ranges.",
    icon: Map,
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/intel/calculator",
    title: "Delivered Price Calculator",
    desc: "Real gantry/NNPC/indicative bases + your own freight input → landed cost. No invented numbers.",
    icon: Calculator,
    accent: "bg-violet-50 text-violet-700",
  },
  {
    href: "/intel/arbitrage",
    title: "Arbitrage Signals",
    desc: "Computed spreads and structural gaps: gantry→pump, state-to-state, LPG deficit, jet spreads.",
    icon: Scale,
    accent: "bg-orange-50 text-orange-700",
  },
  {
    href: "/intel/lpg",
    title: "LPG Desk",
    desc: "A 150–250k-tonne annual deficit, a 5-day buffer, and prices up 5× since 2016.",
    icon: Flame,
    accent: "bg-purple-50 text-purple-700",
  },
  {
    href: "/intel/jet",
    title: "Jet A-1 Desk",
    desc: "The 2026 jet-fuel crisis timeline, DPRP's USD + 25% holdback model, airport spreads.",
    icon: Plane,
    accent: "bg-indigo-50 text-indigo-700",
  },
];

export default function IntelOverview() {
  const latest = latestMonth();
  const prev = monthBefore(latest.month);
  const dprpDelta =
    latest.dprp.utilizationPct != null && prev?.dprp.utilizationPct != null
      ? latest.dprp.utilizationPct - prev.dprp.utilizationPct
      : null;

  return (
    <div>
      <IntelHeader
        title="Nigeria's downstream sector, measured."
        description="The Dangote era is being run on paper trails: monthly fact sheets, price directives, export manifests. FuelLink ingests the official NMDPRA data, verifies it in CI, and publishes it here — free, sourced, and updated monthly. This is the intelligence layer that makes every later transaction on FuelLink trustworthy."
        asOf={monthLabel(latest.month)}
        source="NMDPRA monthly fact sheets (public PDFs) + attributed market sources"
        sourceUrl={nmdpra.source.site}
      >
        <div className="mt-4">
          <Note>
            Coverage: <strong>{nmdpra.months.length} months, Oct 2025 → {monthLabel(latest.month)}</strong>.
            Datasets regenerate automatically each month (GitHub Actions, 12th) and every change ships
            through a reviewed pull request. Generated {generatedAtDate}.
          </Note>
        </div>
      </IntelHeader>

      {/* latest snapshot */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Snapshot — {latest.label}
          </h2>
          {prev && (
            <span className="text-xs text-slate-400">
              month over {monthLabel(prev.month)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Metric
            label="Dangote refinery utilization"
            value={fmtPct(latest.dprp.utilizationPct)}
            sub={
              dprpDelta != null
                ? `${dprpDelta >= 0 ? "+" : "−"}${Math.abs(dprpDelta).toFixed(2)} pts MoM`
                : "DPRP, per NMDPRA"
            }
            tone="warn"
          />
          <Metric
            label="PMS consumption"
            value={fmt(latest.consumption.pmsMld, 1)}
            sub={
              <>
                ML/d · vs {fmt(prev?.consumption.pmsMld, 1)} prev
                <br />
                benchmark 50 ML/d
              </>
            }
          />
          <Metric
            label="PMS sufficiency"
            value={fmt(latest.sufficiencyDays.pms, 1)}
            sub="days of national stock (incl. DPRP)"
            tone={
              (latest.sufficiencyDays.pms ?? 0) >= 28
                ? "good"
                : (latest.sufficiencyDays.pms ?? 0) >= 14
                  ? "warn"
                  : "bad"
            }
          />
          <Metric
            label="Gas supply"
            value={fmt(latest.gas.totalBscfPerDay, 2)}
            sub="Bscf/day national total"
          />
          <Metric
            label="LPG consumption"
            value={fmt(latest.consumption.lpgKtPerDay, 2)}
            sub={`kt/day · sufficiency ${fmt(latest.sufficiencyDays.lpg, 1)} days`}
          />
          <Metric
            label="Modular AGO (domestic)"
            value={fmt(latest.modular.totalAgoDomesticMld, 3)}
            sub="ML/day across 5 modular refineries"
          />
        </div>
      </section>

      {/* dashboards */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Dashboards</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {DASHBOARDS.map((d) => {
            const Icon = d.icon;
            return (
              <Link
                key={d.href}
                href={d.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-primary-300 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${d.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{d.title}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{d.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* coverage table */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Monthly coverage — what each snapshot contains
        </h2>
        <TableShell>
          <thead>
            <tr>
              <Th>Month</Th>
              <Th className="text-right">PMS cons. (ML/d)</Th>
              <Th className="text-right">AGO (ML/d)</Th>
              <Th className="text-right">PMS suff. (days)</Th>
              <Th className="text-right">LPG suff. (days)</Th>
              <Th className="text-right">DPRP util. (%)</Th>
              <Th className="text-right">Gas (Bscf/d)</Th>
            </tr>
          </thead>
          <tbody>
            {[...nmdpra.months]
              .sort((a, b) => b.month.localeCompare(a.month))
              .map((m) => (
                <tr key={m.month} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-slate-900">{monthLabel(m.month)}</Td>
                  <Td className="text-right">{fmt(m.consumption.pmsMld, 1)}</Td>
                  <Td className="text-right">{fmt(m.consumption.agodMld, 1)}</Td>
                  <Td className="text-right">{fmt(m.sufficiencyDays.pms, 1)}</Td>
                  <Td className="text-right">{fmt(m.sufficiencyDays.lpg, 1)}</Td>
                  <Td className="text-right">{fmt(m.dprp.utilizationPct, 2)}</Td>
                  <Td className="text-right">{fmt(m.gas.totalBscfPerDay, 3)}</Td>
                </tr>
              ))}
          </tbody>
        </TableShell>
        <p className="mt-2 text-xs text-slate-400">
          &ldquo;—&rdquo; = not reported by NMDPRA for that month. Each row links to the source fact
          sheet:{" "}
          <a
            href={nmdpra.source.containerListUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-700 hover:underline"
          >
            view the public container
          </a>
          .
        </p>
      </section>

      {/* methodology */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">How this data gets here</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Boxes className="w-5 h-5 text-primary-600" />
            <h3 className="mt-2 font-semibold text-slate-900 text-sm">Ingest</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              A pipeline enumerates NMDPRA&apos;s public blob container, downloads each new fact-sheet
              PDF, and parses the key tables (supply, consumption, sufficiency, prices, gas, LPG).
              Two sheet formats and multiple PDF layout quirks are handled explicitly.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Gauge className="w-5 h-5 text-primary-600" />
            <h3 className="mt-2 font-semibold text-slate-900 text-sm">Verify</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Every dataset is validated against a zod contract and plausibility invariants in CI
              (<code className="text-[11px] bg-slate-100 px-1 rounded">npm run verify:data</code>).
              A scheduled run each month opens a pull request when data changes — a human reviews it
              before it publishes.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Map className="w-5 h-5 text-primary-600" />
            <h3 className="mt-2 font-semibold text-slate-900 text-sm">Cite</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              No estimates, ever. Values NMDPRA didn&apos;t publish render as &ldquo;not
              reported&rdquo;. Where a value is computed (import = total − domestic), it is tagged{" "}
              <span className="font-semibold">derived</span> and the arithmetic is stated. Market
              figures carry their source attribution.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
