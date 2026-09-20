// /intel/lpg — the LPG desk: deficit, buffer, price history, policy.

import type { Metadata } from "next";
import { IntelHeader, Metric, Note, TableShell, Th, Td } from "@/components/intel/bits";
import { lpgMarket, lpgPrices, monthLabel, fmt, generatedAtDate } from "@/lib/intel";

export const metadata: Metadata = {
  title: "LPG Desk",
  description:
    "Nigeria's LPG market: a 150–250k-tonne annual deficit, a 5-day national buffer, prices up 5× since 2016, 62% of gas exported, and the domestic-first policy that changes the math.",
};

const STATE_NAMES: Record<string, string> = {
  lagos: "Lagos", abuja: "Abuja", kano: "Kano", calabar: "Calabar",
  sokoto: "Sokoto", maiduguri: "Maiduguri", ibadan: "Ibadan", enugu: "Enugu",
};

export default function LpgPage() {
  const m = lpgMarket;
  const gapMin = m.demandMt.value - m.supplyMt.max;
  const gapMax = m.demandMt.value - m.supplyMt.min;
  const june = lpgPrices.months.find((x) => x.states);
  const history = m.pricePerKgHistory;

  return (
    <div>
      <IntelHeader
        title="LPG desk"
        description="Cooking gas is the sector's tightest product and its fastest-growing story: a structural deficit, a one-week buffer, and a policy shift that prioritises domestic use. The desk tracks the numbers that drive it."
        asOf="2026 (annual outlook) + Jun 2026 (prices)"
      />

      <section className="mb-8 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric
          label="Demand (2026)"
          value={`${(m.demandMt.value / 1e6).toFixed(2)}M t`}
          sub={m.demandMt.source}
        />
        <Metric
          label="Supply (2026)"
          value={`${(m.supplyMt.min / 1e6).toFixed(2)}–${(m.supplyMt.max / 1e6).toFixed(2)}M t`}
          sub={m.supplyMt.source}
          tone="warn"
        />
        <Metric
          label="Annual gap"
          value={`${gapMin / 1000}–${gapMax / 1000}k t`}
          sub="derived: demand − supply range"
          tone="bad"
        />
        <Metric
          label="National buffer"
          value={`${m.bufferDays.value} days`}
          sub={m.bufferDays.source}
          tone="bad"
        />
      </section>

      <section className="mb-8 grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Price per kg, as reported</h2>
          <div className="space-y-3">
            {history.map((h, i) => {
              const first = history[0];
              const last = history[history.length - 1];
              const pct = ((h.nairaPerKg - first.nairaPerKg) / first.nairaPerKg) * 100;
              return (
                <div key={h.year} className="flex items-center gap-3">
                  <span className="w-14 text-sm font-medium text-slate-500">{h.year}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                      style={{ width: `${Math.max(4, (h.nairaPerKg / last.nairaPerKg) * 100)}%` }}
                    />
                  </div>
                  <span className="w-28 text-right text-sm font-bold text-slate-900">
                    ₦{fmt(h.nairaPerKg, 0)}/kg
                  </span>
                  <span className="w-16 text-right text-[11px] text-slate-400">
                    {i === 0 ? "base" : `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            5× increase 2016 → 2026, as reported. Points only where sourced — no interpolation.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Market structure</h2>
          <div className="mb-4">
            <div className="flex items-baseline justify-between text-sm mb-1">
              <span className="text-slate-600">Share of gas output exported</span>
              <span className="font-bold text-slate-900">{m.exportSharePct.value}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-secondary-500" style={{ width: `${m.exportSharePct.value}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{m.exportSharePct.source}</p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Producer landscape ({m.producers.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {m.producers.map((p) => (
              <span
                key={p}
                className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs text-slate-700"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <Note tone="warn">{m.policyNote}</Note>
          </div>
        </div>
      </section>

      {june && june.states && (
        <section>
          <h2 className="font-semibold text-slate-900 mb-3">
            State retail prices — {monthLabel(june.period)} (₦/kg)
          </h2>
          <TableShell>
            <thead>
              <tr>
                <Th>State</Th>
                <Th className="text-right">Max</Th>
                <Th className="text-right">Min</Th>
                <Th className="text-right">Avg</Th>
              </tr>
            </thead>
            <tbody>
              {[...june.states]
                .sort((a, b) => (b.maxPerKg ?? 0) - (a.maxPerKg ?? 0))
                .map((s) => (
                  <tr key={s.state} className="hover:bg-slate-50/60">
                    <Td className="font-medium text-slate-900">{STATE_NAMES[s.state]}</Td>
                    <Td className="text-right">{fmt(s.maxPerKg, 0)}</Td>
                    <Td className="text-right">{fmt(s.minPerKg, 0)}</Td>
                    <Td className="text-right font-semibold">{fmt(s.avgPerKg, 0)}</Td>
                  </tr>
                ))}
            </tbody>
          </TableShell>
          <p className="mt-2 text-xs text-slate-400">
            Source:{" "}
            <a href={june.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">
              NMDPRA fact sheet ({monthLabel(june.period)})
            </a>
            {" "}· generated {generatedAtDate}
          </p>
        </section>
      )}
    </div>
  );
}
