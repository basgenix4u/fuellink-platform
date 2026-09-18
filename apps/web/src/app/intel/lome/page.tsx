// /intel/lome — the Lomé paradox: Nigeria's "imports" that are our own exports.

import type { Metadata } from "next";
import { IntelHeader, Metric, Note, TableShell, Th, Td, SourceChip, NR } from "@/components/intel/bits";
import { BarLineBox } from "@/components/intel/charts";
import { lome, monthLabel, fmt } from "@/lib/intel";

export const metadata: Metadata = {
  title: "Lomé Index",
  description:
    "An estimated 70–80% of Nigeria's waterborne fuel 'imports' in Mar–May 2026 was DPRP product that left the country and returned via Lomé. Monthly import/export flows, NBS product exports, and the jet-fuel surge.",
};

export default function LomePage() {
  const { paradox, monthly, nbsQ1Exports, jetExports } = lome;

  const chartData = monthly.map((m) => ({
    x: monthLabel(m.month),
    imports: m.pmsImportMld,
    pmsExport: m.pmsExportMld,
    agodExport: m.agodExportMld,
    atkExport: m.atkExportMld,
  }));

  const nbsTotal = nbsQ1Exports.items.reduce((s, i) => s + i.nairaBillion, 0);

  return (
    <div>
      <IntelHeader
        title="The Lomé Index"
        description="The strangest data pattern in the Dangote era: fuel leaving Nigeria, landing in Togo, and coming back on Nigerian customs papers as an 'import'. It distorts import statistics, trade policy, and anyone's dashboard that reads them naively."
        source={paradox.source}
      />

      <section className="mb-8 rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-primary-700 mb-2">{paradox.title}</p>
        <p className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug">
          {paradox.statement}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SourceChip label={paradox.source} url={paradox.source.includes("http") ? paradox.source : "https://nmdpra.gov.ng/"} />
          <span className="text-xs text-slate-500">
            period: {paradox.period} · share: {paradox.shareRange[0]}–{paradox.shareRange[1]}%
          </span>
        </div>
      </section>

      <section className="mb-8 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Metric
          label="Jet exports — May 2026"
          value={`${fmt(jetExports.may2026Mt, 0)} MT`}
          sub="DPRP export volumes"
        />
        <Metric
          label="Jet export surge — Apr 2026"
          value={`+${jetExports.april2026PctChangeYoy}%`}
          sub={`YoY · ~${fmt(jetExports.april2026Bpd, 0)} bpd`}
          tone="warn"
        />
        <Metric
          label="Top jet destination"
          value={jetExports.topDestination}
          sub="share not published — shown as reported"
        />
        <Metric
          label="NBS Q1 2026 product exports"
          value={`₦${fmt(nbsTotal, 1)}B`}
          sub="AGO + jet + crude + PMS, 4 products"
          tone="good"
        />
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">PMS import receipts vs DPRP product exports (2026)</h2>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">
          ML/day. Import receipts are NMDPRA fact-sheet figures; export volumes are DPRP as
          reported. Watch April: 17.1 ML/day of PMS <em>leaving</em> while 3.7 ML/day of PMS
          &ldquo;arrives&rdquo;.
        </p>
        <BarLineBox
          data={chartData}
          xKey="x"
          unit=" ML/d"
          yDomain={[0, 25]}
          bars={[
            { key: "pmsExport", name: "DPRP PMS export", color: "#0D5C2F" },
            { key: "agodExport", name: "DPRP AGO export", color: "#FF8C00" },
            { key: "atkExport", name: "DPRP ATK export", color: "#9333EA" },
          ]}
          lines={[{ key: "imports", name: "PMS import receipts (NMDPRA)", color: "#DC2626" }]}
        />
        <div className="mt-4">
          <Note>
            Jun 2026 import receipts jumped to <strong>18.1 ML/day (+207% MoM)</strong> — the month
            the &ldquo;returning exports&rdquo; theory becomes visible in the official data itself.
            NMDPRA attributes the June receipts to Megastar imports as reported.
          </Note>
        </div>
      </section>

      <section className="mb-8 grid lg:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">
            NBS foreign trade — Q1 2026 product exports
          </h2>
          <TableShell>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Destination</Th>
                <Th className="text-right">₦ billion</Th>
              </tr>
            </thead>
            <tbody>
              {nbsQ1Exports.items.map((i) => (
                <tr key={i.product} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-slate-900">{i.product}</Td>
                  <Td>{i.destination ?? <NR />}</Td>
                  <Td className="text-right font-semibold">{fmt(i.nairaBillion, 2)}</Td>
                </tr>
              ))}
              <tr>
                <Td className="font-bold text-slate-900" colSpan={2}>
                  4-product total
                </Td>
                <Td className="text-right font-bold text-primary-700">{fmt(nbsTotal, 2)}</Td>
              </tr>
            </tbody>
          </TableShell>
          <p className="mt-2 text-xs text-slate-400">
            Source: {nbsQ1Exports.source}
          </p>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            Other reported destinations: {nbsQ1Exports.otherDestinations.join(", ")}.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900 mb-3">What this means for the market</h3>
          <ul className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <li className="flex gap-2.5">
              <span className="font-bold text-primary-700 flex-shrink-0">1.</span>
              <span>
                &ldquo;Import&rdquo; statistics overstate foreign supply. A depot or marketer
                deciding on landed-cost models needs <em>origin-aware</em> flows — this index is the
                start of that.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="font-bold text-primary-700 flex-shrink-0">2.</span>
              <span>
                Export-eligible volumes (PMS, AGO, ATK, jet) are a real, growing trading book. Jet
                alone moved 476,099 MT in May 2026.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="font-bold text-primary-700 flex-shrink-0">3.</span>
              <span>
                Corridors — Lomé, Cotonou, Cameroun, and jet lanes to Europe — are where pricing
                power actually forms. FuelLink&apos;s Phase 3 trade desk is built on these flows.
              </span>
            </li>
          </ul>
          <div className="mt-4">
            <Note>
              Export volumes for Jan–Mar 2026 are not in the fact sheets we parse (DPRP publishes
              them elsewhere); the table shows what the regulator printed.
            </Note>
          </div>
        </div>
      </section>
    </div>
  );
}
