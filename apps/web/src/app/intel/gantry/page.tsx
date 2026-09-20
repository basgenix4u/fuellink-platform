// /intel/gantry — PMS price ladder: gantry → NNPC basis → indicative pump.

import type { Metadata } from "next";
import { IntelHeader, Metric, Note, TableShell, Th, Td, Derived, NR } from "@/components/intel/bits";
import { GantryChart, type GantryChartRow } from "@/components/intel/GantryChart";
import { gantry, monthLabel, fmtNaira } from "@/lib/intel";

export const metadata: Metadata = {
  title: "Gantry Tracker",
  description:
    "Nigeria's PMS price ladder in one chart: DPRP ex-gantry price, NNPC price-revision basis, and NMDPRA indicative state pump prices for Lagos and Abuja — every point sourced.",
};

const ISSUER_LABEL: Record<string, string> = {
  dprp: "DPRP (ex-gantry)",
  nnpc: "NNPC (price revision)",
  nmdpra_indicative_lagos: "NMDPRA indicative — Lagos",
  nmdpra_indicative_abuja: "NMDPRA indicative — Abuja",
};

export default function GantryPage() {
  const points = gantry.points;

  // dated points for the timeline (NNPC '2026' points have no month → table only)
  const dated = points.filter((p) => p.date.length === 7);
  const byDate = new Map<string, GantryChartRow>();
  for (const p of dated) {
    const row = byDate.get(p.date) ?? { x: monthLabel(p.date) };
    if (p.issuer === "nmdpra_indicative_lagos") row.lagos = p.price;
    if (p.issuer === "nmdpra_indicative_abuja") row.abuja = p.price;
    if (p.issuer === "nnpc") row.nnpc = p.price;
    byDate.set(p.date, row);
  }
  const chartData = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);

  // current ladder (April 2026 indicative + 2026 gantry band + July NNPC)
  const aprLagos = points.find((p) => p.date === "2026-04" && p.issuer === "nmdpra_indicative_lagos");
  const aprAbuja = points.find((p) => p.date === "2026-04" && p.issuer === "nmdpra_indicative_abuja");
  const dprp = points.find((p) => p.issuer === "dprp");
  const nnpcJul = points.find((p) => p.issuer === "nnpc" && p.date === "2026-07");
  const dprpMid = dprp && dprp.priceHigh ? (dprp.price + dprp.priceHigh) / 2 : null;

  return (
    <div>
      <IntelHeader
        title="Gantry price tracker"
        description="Every litre of PMS in Nigeria carries a price from the same three places: the refinery gantry (DPRP and NNPCL), the NNPC price-revision basis, and NMDPRA's indicative state pump prices. This is that ladder — the spread between its rungs is the margin the whole trade lives on."
        asOf="Aug 2026 (latest reported points)"
        source="NMDPRA fact sheets + NNPC/DPRP revisions as reported"
      />

      <section className="mb-8 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric
          label="DPRP ex-gantry PMS (2026)"
          value={`${fmtNaira(dprp?.price ?? null)}${dprp?.priceHigh ? `–${fmtNaira(dprp.priceHigh)}` : ""}`}
          sub="observed range, as reported"
        />
        <Metric
          label="NNPC basis (Jul 2026)"
          value={fmtNaira(nnpcJul?.price ?? null)}
          sub="lowest point of the 2026 correction cycle"
        />
        <Metric
          label="Indicative Lagos (Apr 2026)"
          value={fmtNaira(aprLagos?.price ?? null)}
          sub="NMDPRA indicative pump price"
        />
        <Metric
          label="Indicative Abuja (Apr 2026)"
          value={fmtNaira(aprAbuja?.price ?? null)}
          sub="NMDPRA indicative pump price"
        />
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">PMS ladder, Oct 2025 → Aug 2026</h2>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">
          Dated points only — NNPC revisions published without a month (₦1,320 → ₦1,150) sit in the
          table below. Orange band: DPRP ex-gantry range.
        </p>
        <GantryChart data={chartData} bandLow={dprp?.price ?? 1000} bandHigh={dprp?.priceHigh ?? 1200} />
      </section>

      <section className="mb-8 grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900 mb-3">The ladder, rung by rung (Apr 2026)</h3>
          <ol className="space-y-0 text-sm">
            {[
              {
                n: "1",
                label: "DPRP ex-gantry",
                value: `${fmtNaira(dprp?.price ?? null)} – ${fmtNaira(dprp?.priceHigh ?? null)}`,
                note: "Dangote's product leaves the gantry here.",
              },
              {
                n: "2",
                label: "NNPC price-revision basis",
                value: fmtNaira(nnpcJul?.price ?? null),
                note: "NNPC's monthly directive basis (July 2026: ₦1,110/L).",
              },
              {
                n: "3",
                label: "NMDPRA indicative — Lagos",
                value: fmtNaira(aprLagos?.price ?? null),
                note: "Regulator's indicative pump price (Apr 2026).",
              },
              {
                n: "4",
                label: "NMDPRA indicative — Abuja",
                value: fmtNaira(aprAbuja?.price ?? null),
                note: "Abuja runs the highest indicative of the 8 states (Apr 2026).",
              },
            ].map((r) => (
              <li key={r.n} className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-700 text-white text-xs font-bold flex items-center justify-center">
                  {r.n}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-800">{r.label}</p>
                    <p className="font-bold text-slate-900 whitespace-nowrap">{r.value}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{r.note}</p>
                </div>
              </li>
            ))}
          </ol>
          {dprpMid != null && aprLagos && dprp && (
            <div className="mt-3">
              <Note>
                Apr 2026 gantry→Lagos-pump spread:{" "}
                <strong>{fmtNaira(aprLagos.price - (dprp.price + (dprp.priceHigh ?? dprp.price)) / 2)}</strong>{" "}
                per litre vs the mid of the DPRP band (
                {fmtNaira(aprLagos.price - (dprp.priceHigh ?? dprp.price))} to {fmtNaira(aprLagos.price - dprp.price)}
                across the band){" "}
                <Derived note="Arithmetic over sourced prices only." /> — before trucking, storage
                and risk. This is the margin a marketer&apos;s logistics must fit inside.
              </Note>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900 mb-3">2026 correction cycle</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Through 2026 the NNPC basis moved <strong>₦1,320 → ₦1,150 → ₦1,110</strong> (July) and
            then the indicative pump prices rebounded to{" "}
            <strong>₦1,265 (Lagos) / ₦1,335 (Abuja)</strong> in early August — a{" "}
            <strong>{fmtNaira(1265 - 1110)}</strong> swing back in Lagos within weeks.
            <span className="ml-1"><Derived note="1,265 − 1,110, sourced points." /></span>
          </p>
          <div className="mt-4">
            <Note tone="warn">
              Two 2026 NNPC revisions (₦1,320, ₦1,150) were published without a month in the sources
              we hold, so they are stored as &ldquo;2026&rdquo; and kept out of the timeline chart.
              We do not guess months.
            </Note>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 mb-3">All reported points</h2>
        <TableShell>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Issuer</Th>
              <Th>Basis</Th>
              <Th className="text-right">Price (₦/L)</Th>
              <Th>Note</Th>
              <Th>Source</Th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                <Td className="font-medium text-slate-900 whitespace-nowrap">
                  {p.date.length === 7 ? monthLabel(p.date) : p.date}
                </Td>
                <Td>{ISSUER_LABEL[p.issuer]}</Td>
                <Td>
                  <span className="capitalize">{p.basis}</span>
                </Td>
                <Td className="text-right font-semibold whitespace-nowrap">
                  {fmtNaira(p.price)}
                  {p.priceHigh ? ` – ${fmtNaira(p.priceHigh)}` : ""}
                </Td>
                <Td className="max-w-[280px]">
                  {p.note ? (
                    <span className="text-xs">{p.note}</span>
                  ) : (
                    <NR />
                  )}
                </Td>
                <Td>
                  <a
                    href={p.source.startsWith("http") ? p.source : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      p.source.startsWith("http")
                        ? "text-primary-700 hover:underline text-xs"
                        : "text-xs text-slate-500"
                    }
                  >
                    {p.source.startsWith("http") ? "fact sheet" : p.source}
                  </a>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </section>
    </div>
  );
}
