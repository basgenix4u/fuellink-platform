// /intel/prices — state price indices: PMS indicative/actual across 8 states + LPG.

import type { Metadata } from "next";
import { IntelHeader, Metric, Note, TableShell, Th, Td, Derived, NR } from "@/components/intel/bits";
import { LineChartBox, RangeBandBox } from "@/components/intel/charts";
import { STATE_LABELS, monthLabel, fmt, fmtNaira, fmtDelta, pmsPrices, lpgPrices, nmdpra } from "@/lib/intel";

export const metadata: Metadata = {
  title: "State Price Indices",
  description:
    "NMDPRA indicative and actual PMS pump prices across Lagos, Abuja, Kano, Calabar, Sokoto, Maiduguri, Ibadan and Enugu — plus LPG retail ranges by state.",
};

const STATE_ORDER = ["lagos", "abuja", "kano", "calabar", "sokoto", "maiduguri", "ibadan", "enugu"] as const;
const STATE_COLORS: Record<string, string> = {
  lagos: "#0D5C2F",
  abuja: "#FF8C00",
  kano: "#DC2626",
  calabar: "#0284C7",
  sokoto: "#7C3AED",
  maiduguri: "#DB2777",
  ibadan: "#059669",
  enugu: "#475569",
};

export default function PricesPage() {
  const months = [...pmsPrices.months].sort((a, b) => a.period.localeCompare(b.period));
  const mOct = months.find((m) => m.period === "2025-10");
  const mMar = months.find((m) => m.period === "2026-03");
  const mApr = months.find((m) => m.period === "2026-04");

  const pmsChart = months.map((m) => {
    const row: Record<string, unknown> = { x: monthLabel(m.period) };
    for (const s of m.states) row[s.state] = s.indicativePerLitre;
    return row;
  });

  const lpgRange = lpgPrices.months
    .filter((m) => m.nationalRangePerKg)
    .map((m) => ({
      x: monthLabel(m.period),
      min: m.nationalRangePerKg![0],
      max: m.nationalRangePerKg![1],
      mid: (m.nationalRangePerKg![0] + m.nationalRangePerKg![1]) / 2,
    }));

  const lpgJune = lpgPrices.months.find((m) => m.states);

  return (
    <div>
      <IntelHeader
        title="State price indices"
        description="NMDPRA publishes indicative pump prices for eight states each month — the anchor every state price fights around. Below: the full table, the divergence between states, and the LPG retail band."
        asOf={mApr ? monthLabel(mApr.period) : undefined}
        source="NMDPRA fact sheets — Indicative Fuel Prices tables"
        sourceUrl={nmdpra.source.site}
      />

      {/* FX/benchmark context */}
      {mApr && (
        <section className="mb-8 grid grid-cols-2 xl:grid-cols-4 gap-3">
          <Metric label="NFEM rate (avg)" value={`₦${fmt(mApr.nfemRatePerUsd, 2)}`} sub="per USD, used in NMDPRA computation" />
          <Metric label="Brent" value={`$${fmt(mApr.brentUsdPerBarrel, 2)}`} sub="per barrel" />
          <Metric label="Gasoline benchmark" value={`$${fmt(mApr.gasolineUsdPerMt, 2)}`} sub="per metric tonne" />
          <Metric
            label="State spread (avg actual)"
            value={(() => {
              const avgs = mApr.states
                .map((s) => s.avgActualPerLitre)
                .filter((v): v is number => v != null);
              return avgs.length ? fmtNaira(Math.max(...avgs) - Math.min(...avgs)) : "—";
            })()}
            sub={
              <>
                max−min across 8 states, {monthLabel(mApr.period)} <Derived note="Arithmetic over published actuals." />
              </>
            }
          />
        </section>
      )}

      {/* PMS state table */}
      <section className="mb-8">
        <h2 className="font-semibold text-slate-900 mb-3">PMS pump prices by state (₦/litre)</h2>
        <TableShell>
          <thead>
            <tr>
              <Th>State</Th>
              <Th className="text-right">Indicative Oct 2025</Th>
              <Th className="text-right">Indicative Mar 2026</Th>
              <Th className="text-right">Indicative Apr 2026</Th>
              <Th className="text-right">Δ Mar→Apr</Th>
              <Th className="text-right">Avg actual Apr</Th>
              <Th className="text-right">Max actual Apr</Th>
              <Th className="text-right">Min actual Apr</Th>
            </tr>
          </thead>
          <tbody>
            {STATE_ORDER.map((st) => {
              const rOct = mOct?.states.find((s) => s.state === st);
              const rMar = mMar?.states.find((s) => s.state === st);
              const rApr = mApr?.states.find((s) => s.state === st);
              return (
                <tr key={st} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-slate-900">{STATE_LABELS[st]}</Td>
                  <Td className="text-right">{fmt(rOct?.indicativePerLitre)}</Td>
                  <Td className="text-right">{fmt(rMar?.indicativePerLitre)}</Td>
                  <Td className="text-right font-semibold">{fmt(rApr?.indicativePerLitre)}</Td>
                  <Td className="text-right">
                    {fmtDelta(rApr?.indicativePerLitre ?? null, rMar?.indicativePerLitre ?? null)}
                  </Td>
                  <Td className="text-right">{fmt(rApr?.avgActualPerLitre)}</Td>
                  <Td className="text-right">{fmt(rApr?.maxActualPerLitre)}</Td>
                  <Td className="text-right">{fmt(rApr?.minActualPerLitre)}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
        <p className="mt-2 text-xs text-slate-400">
          Oct 2025 sheet predates the actuals block (indicative only, 7 of 8 states). March/April
          2026 sheets publish indicative + max/avg/min actuals.
        </p>
      </section>

      {/* PMS chart */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Indicative pump price by state</h2>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">
          ₦/litre. The north–south wedge (Maiduguri/Sokoto vs Lagos/Ibadan) is the state-arbitrage
          trade.
        </p>
        <LineChartBox
          data={pmsChart}
          xKey="x"
          unit="₦"
          domain={[850, 1450]}
          series={STATE_ORDER.map((st) => ({
            key: st,
            name: STATE_LABELS[st],
            color: STATE_COLORS[st],
          }))}
          height={340}
        />
      </section>

      {/* LPG */}
      <section>
        <h2 className="font-semibold text-slate-900 mb-3">LPG retail prices</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-1">National observed range (₦/kg)</h3>
            <p className="text-xs text-slate-500 mb-4">
              Midline is arithmetic over the published min/max.
            </p>
            <RangeBandBox
              data={lpgRange}
              xKey="x"
              lowKey="min"
              highKey="max"
              midKey="mid"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-1">
              State table — {lpgJune ? monthLabel(lpgJune.period) : "June 2026"}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              First sheet to publish a full LPG state table.
            </p>
            <TableShell>
              <thead>
                <tr>
                  <Th>State</Th>
                  <Th className="text-right">Min (₦/kg)</Th>
                  <Th className="text-right">Avg (₦/kg)</Th>
                </tr>
              </thead>
              <tbody>
                {lpgJune?.states
                  ? [...lpgJune.states]
                      .sort((a, b) => (b.avgPerKg ?? 0) - (a.avgPerKg ?? 0))
                      .map((s) => (
                        <tr key={s.state} className="hover:bg-slate-50/60">
                          <Td className="font-medium text-slate-900">{STATE_LABELS[s.state]}</Td>
                          <Td className="text-right">{fmt(s.minPerKg, 0)}</Td>
                          <Td className="text-right font-semibold">{fmt(s.avgPerKg, 0)}</Td>
                        </tr>
                      ))
                  : <tr><Td><NR /></Td></tr>}
              </tbody>
            </TableShell>
          </div>
        </div>
        <div className="mt-4">
          <Note>
            LPG prices more than doubled inside this window: the national top moved from ₦1,500/kg
            (Nov 2025) to ₦1,800/kg (May 2026) — see the{" "}
            <a href="/intel/lpg" className="text-primary-700 hover:underline">LPG Desk</a> for the
            structural deficit behind it.
          </Note>
        </div>
      </section>
    </div>
  );
}
