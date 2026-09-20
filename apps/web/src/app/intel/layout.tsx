// /intel — section layout: intel sub-nav + data-provenance footer.

import type { Metadata } from "next";
import { IntelNav } from "@/components/intel/IntelNav";
import { generatedAt, generatedAtDate, nmdpra } from "@/lib/intel";

export const metadata: Metadata = {
  title: {
    default: "Intelligence — FuelLink",
    template: "%s · Intelligence — FuelLink",
  },
  description:
    "Nigeria's downstream petroleum sector, measured: NMDPRA fact-sheet data on refinery output, supply, consumption, sufficiency, state prices, and trade flows — published, sourced, and updated monthly.",
};

export default function IntelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 shadow-sm">
        <IntelNav generatedAt={generatedAt} />
      </header>
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-slate-500 leading-relaxed">
          <p>
            <span className="font-semibold text-slate-700">Data provenance.</span> Datasets generated{" "}
            {generatedAt} by FuelLink&apos;s automated ingest from{" "}
            <a
              href={nmdpra.source.site}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-700 hover:underline"
            >
              NMDPRA&apos;s public fact-sheet container
            </a>{" "}
            (monthly &ldquo;State of the Midstream and Downstream Sector&rdquo; PDFs) plus attributed
            market sources listed per dataset. Every figure is a real published value — missing values
            are shown as &ldquo;not reported&rdquo;, never estimated. Values marked{" "}
            <span className="font-semibold">derived</span> are arithmetic over sourced figures.
            Intelligence is informational and is not trading advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
