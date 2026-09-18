// /intel/sufficiency — national days-of-sufficiency by product.

import type { Metadata } from "next";
import { IntelHeader, Metric, Note, Derived } from "@/components/intel/bits";
import { LineChartBox } from "@/components/intel/charts";
import { latestMonth, monthLabel, fmt, nmdpra } from "@/lib/intel";

export const metadata: Metadata = {
  title: "Sufficiency Radar",
  description:
    "Days of national fuel stock for PMS, AGO, ATK and LPG per NMDPRA fact sheets — how long Nigeria could coast on existing stock, month by month.",
};

export default function SufficiencyPage() {
  const months = [...nmdpra.months].sort((a, b) => a.month.localeCompare(b.month));
  const latest = latestMonth();

  const chartData = months.map((m) => ({
    x: monthLabel(m.month),
    pms: m.sufficiencyDays.pms,
    agod: m.sufficiencyDays.agod,
    atk: m.sufficiencyDays.atk,
    lpg: m.sufficiencyDays.lpg,
  }));

  const bench = latest.benchmark;

  return (
    <div>
      <IntelHeader
        title="Sufficiency radar"
        description="Sufficiency is the regulator's answer to one question: if supply stopped tomorrow, how many days of stock does Nigeria hold? It is the single best early-warning number in the downstream sector — and it justifies itself during every shock."
        asOf={monthLabel(latest.month)}
        source="NMDPRA fact sheets — National Fuel Sufficiency block"
        sourceUrl={nmdpra.source.site}
      />

      <section className="mb-8 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric
          label="PMS — days"
          value={fmt(latest.sufficiencyDays.pms, 1)}
          sub={latest.sufficiencyDays.includesDprpStock ? "incl. DPRP stock" : "excl. DPRP stock"}
          tone={(latest.sufficiencyDays.pms ?? 0) >= 28 ? "good" : (latest.sufficiencyDays.pms ?? 0) >= 14 ? "warn" : "bad"}
        />
        <Metric
          label="AGO — days"
          value={fmt(latest.sufficiencyDays.agod, 1)}
          sub="diesel"
          tone="good"
        />
        <Metric
          label="ATK — days"
          value={fmt(latest.sufficiencyDays.atk, 1)}
          sub="aviation turbine (kerosene)"
          tone="good"
        />
        <Metric
          label="LPG — days"
          value={fmt(latest.sufficiencyDays.lpg, 1)}
          sub="cooking gas — the tightest product"
          tone="warn"
        />
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Days of national stock, Oct 2025 → {monthLabel(latest.month)}</h2>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">
          LPG never leaves the danger zone: 5–22 days across the whole window, vs 11–33 for PMS.
        </p>
        <LineChartBox
          data={chartData}
          xKey="x"
          unit=" days"
          domain={[0, 120]}
          series={[
            { key: "pms", name: "PMS", color: "#0D5C2F" },
            { key: "agod", name: "AGO", color: "#FF8C00" },
            { key: "atk", name: "ATK", color: "#0284C7" },
            { key: "lpg", name: "LPG", color: "#9333EA" },
          ]}
        />
      </section>

      <section className="mb-8 grid lg:grid-cols-2 gap-4">
        <div>
          <Note tone="warn">
            <strong>Basis change matters.</strong> From Feb 2026 the published sufficiency{" "}
            <em>includes</em> gross PMS stock at the Dangote refinery (per sheet note); Dec 2025 and
            Jan 2026 <em>excluded</em> it. Compare across that boundary with care — a jump may be
            stock basis, not new barrels.
          </Note>
          <div className="mt-3">
            <Note>
              <strong>Oct 2025 sheet quirk:</strong> two sufficiency blocks were printed (
              &ldquo;Fuel Sufficiency Levels&rdquo; 14/41/18/4 and &ldquo;National Fuel
              Sufficiency&rdquo; 11/38/15/5). The national block is used, consistently across
              months.
            </Note>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900 mb-3">
            Consumption vs NMDPRA 2026 daily demand benchmark
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "PMS", val: latest.consumption.pmsMld, bench: bench.pmsMld, unit: "ML/d" },
              { label: "AGO", val: latest.consumption.agodMld, bench: bench.agodMld, unit: "ML/d" },
              { label: "ATK", val: latest.consumption.atkMld, bench: bench.atkMld, unit: "ML/d" },
              { label: "LPG", val: latest.consumption.lpgKtPerDay, bench: bench.lpgKtPerDay, unit: "kt/d" },
            ].map((r) => {
              const gap = r.val != null && r.bench != null ? r.val - r.bench : null;
              const pct = r.val != null && r.bench ? (r.val / r.bench) * 100 : null;
              return (
                <div key={r.label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">{r.label} ({r.unit})</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(r.val, 1)}</p>
                  <p className="text-[11px] text-slate-500">
                    benchmark {fmt(r.bench, 1)}
                    {pct != null && (
                      <>
                        {" "}· {pct.toFixed(0)}% of benchmark{" "}
                        <Derived note="consumption ÷ benchmark, sourced values." />
                      </>
                    )}
                    {gap != null && (
                      <>
                        {" "}
                        ({gap >= 0 ? "+" : "−"}
                        {Math.abs(gap).toFixed(1)})
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            Jul 2026 consumption is down across the board vs the Oct 2025 peak (PMS 56.7 → 35.7
            ML/d) — the holiday-season dip shows up first in sufficiency, then in price.
          </p>
        </div>
      </section>
    </div>
  );
}
