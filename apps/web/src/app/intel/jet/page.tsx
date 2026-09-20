// /intel/jet — the Jet A-1 desk: crisis timeline, DPRP model, airport spreads.

import type { Metadata } from "next";
import { IntelHeader, Metric, Note } from "@/components/intel/bits";
import { jet, lome, monthLabel, fmt, fmtNaira } from "@/lib/intel";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jet A-1 Desk",
  description:
    "The 2026 jet-fuel crisis in Nigeria: prices from ₦900 to ₦3,300/litre and back, AON's shutdown threat, DPRP's USD + 25% holdback model, and wide airport-to-airport spreads.",
};

export default function JetPage() {
  const t = jet.timeline;
  const crisis = t[1];
  const stable = t[t.length - 1];
  const spread = jet.airportSpreadExample.maxPerLitre - jet.airportSpreadExample.minPerLitre;

  return (
    <div>
      <IntelHeader
        title="Jet A-1 desk"
        description="Jet fuel is where Nigeria's refinery boom hits its most fragile customer: airlines. In 2026 the product went from quietly available to ₦3,300/litre in weeks — and the pricing model that followed (USD, holdback, wide spreads) is a template FuelLink's forward mechanics are built from."
        asOf="Sep 2026 (stabilised range)"
      />

      <section className="mb-8 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric
          label="Pre-crisis (Feb 2026)"
          value={fmtNaira(t[0].nairaPerLitre)}
          sub="per litre, as reported"
        />
        <Metric
          label="Crisis peak (Apr 2026)"
          value={fmtNaira(crisis.nairaPerLitre)}
          sub={`${((crisis.nairaPerLitre / t[0].nairaPerLitre - 1) * 100).toFixed(0)}% above Feb (derived)`}
          tone="bad"
        />
        <Metric
          label="Stabilised (Jun–Sep 2026)"
          value={`${fmtNaira(stable.nairaPerLitre, 0)}–${fmtNaira(stable.nairaPerLitreHigh ?? stable.nairaPerLitre, 0)}`}
          sub="per litre, as reported"
          tone="warn"
        />
        <Metric
          label={`Spread at ${jet.airportSpreadExample.airport}`}
          value={`${fmtNaira(spread)}/L`}
          sub={`${fmtNaira(jet.airportSpreadExample.minPerLitre, 0)} – ${fmtNaira(jet.airportSpreadExample.maxPerLitre, 0)}`}
          tone="warn"
        />
      </section>

      <section className="mb-8 grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Crisis timeline (₦/litre)</h2>
          <ol className="relative border-l-2 border-slate-200 ml-2 space-y-6">
            {t.map((p) => (
              <li key={p.date} className="ml-5">
                <span
                  className={`absolute -left-[9px] w-4 h-4 rounded-full border-4 border-white ${
                    p.date === "2026-04" ? "bg-danger-500" : p.date === "2026-02" ? "bg-primary-500" : "bg-secondary-500"
                  }`}
                />
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{monthLabel(p.date)}</p>
                  <p className="text-lg font-bold text-slate-900">
                    {fmtNaira(p.nairaPerLitre, 0)}
                    {p.nairaPerLitreHigh ? ` – ${fmtNaira(p.nairaPerLitreHigh, 0)}` : ""}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.note}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{p.source}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-secondary-200 bg-gradient-to-br from-secondary-50 to-white p-5">
            <h3 className="font-semibold text-slate-900">The DPRP pricing model</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm font-bold">
                {jet.dprpPricingModel.currency}
              </span>
              <span className="text-slate-500 text-sm">ex-gantry, priced in</span>
              <span className="rounded-lg bg-secondary-500 text-white px-3 py-1.5 text-sm font-bold">
                +{jet.dprpPricingModel.priceHoldbackPct}%
              </span>
              <span className="text-slate-500 text-sm">price holdback</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{jet.dprpPricingModel.note}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Why it matters</h3>
            <ul className="space-y-2.5">
              {jet.context.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-secondary-600 flex-shrink-0">{i + 1}.</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <Note>
            <strong>Export side:</strong> jet moved {fmt(lome.jetExports.may2026Mt, 0)} MT in May
            2026 and surged ~+{lome.jetExports.april2026PctChangeYoy}%
            YoY in April — the product is simultaneously a domestic crisis and a fast-growing
            export book. See the{" "}
            <Link href="/intel/lome" className="text-primary-700 hover:underline font-semibold">
              Lomé Index
            </Link>
            .
          </Note>
        </div>
      </section>
    </div>
  );
}
