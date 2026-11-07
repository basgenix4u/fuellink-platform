import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { IntelNav } from "@/components/intel/IntelNav";
import { generatedAt, nmdpra } from "@/lib/intel";

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
    <div className="flex min-h-dvh flex-col bg-[#f7f8f7]">
      <div className="sticky top-0 z-40">
        <IntelNav generatedAt={generatedAt} />
      </div>

      <main className="relative flex-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] mesh-brand opacity-70"
        />
        <div className="page-max page-x relative py-6 lg:py-9">
          <div className="page-enter">{children}</div>
        </div>
      </main>

      <footer className="relative border-t border-[var(--hairline)] bg-white">
        <div className="page-max page-x py-6">
          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-6">
            <div className="flex items-center gap-2 lg:items-start">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-semibold text-slate-900">Data provenance</p>
                <p className="t-meta">Generated {generatedAt.slice(0, 10)}</p>
              </div>
            </div>

            <p className="max-w-4xl text-[11.5px] leading-relaxed text-slate-500">
              Datasets generated {generatedAt} by FuelLink&apos;s automated ingest from{" "}
              <a
                href={nmdpra.source.site}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-medium text-primary-700 hover:underline"
              >
                NMDPRA&apos;s public fact-sheet container
                <ArrowUpRight className="h-3 w-3" />
              </a>{" "}
              (monthly &ldquo;State of the Midstream and Downstream Sector&rdquo; PDFs) plus attributed
              market sources listed per dataset. Every figure is a real published value — missing
              values are shown as &ldquo;not reported&rdquo;, never estimated. Values marked derived
              are arithmetic over sourced figures. Intelligence is informational and is not trading
              advice.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--hairline)] pt-4">
            {[
              { label: "Gantry tracker", href: "/intel/gantry" },
              { label: "Sufficiency", href: "/intel/sufficiency" },
              { label: "Landed cost", href: "/intel/calculator" },
              { label: "Monthly reports", href: "/reports" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="press text-[11.5px] font-medium text-slate-500 hover:text-primary-700"
              >
                {link.label}
              </Link>
            ))}
            <span className="ml-auto t-meta">FuelLink Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
