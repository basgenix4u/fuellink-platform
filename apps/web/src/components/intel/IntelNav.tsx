"use client";

// FuelLink Intelligence — section navigation with active state.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS: { label: string; href: string; exact?: boolean }[] = [
  { label: "Overview", href: "/intel", exact: true },
  { label: "Gantry Tracker", href: "/intel/gantry" },
  { label: "Sufficiency", href: "/intel/sufficiency" },
  { label: "Lomé Index", href: "/intel/lome" },
  { label: "State Prices", href: "/intel/prices" },
  { label: "Calculator", href: "/intel/calculator" },
  { label: "Arbitrage", href: "/intel/arbitrage" },
  { label: "LPG Desk", href: "/intel/lpg" },
  { label: "Jet Desk", href: "/intel/jet" },
];

export function IntelNav({ generatedAt }: { generatedAt: string }) {
  const pathname = usePathname();
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-primary-700 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              FuelLink
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold text-primary-700 whitespace-nowrap">Intelligence</span>
            <span
              title={`Data generated ${generatedAt} by the automated NMDPRA ingest (public fact-sheet container). Refreshed monthly. Every value is a published figure; missing values are shown as "not reported".`}
              className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-100 px-2.5 py-0.5 text-[11px] font-medium text-primary-700 cursor-help"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              NMDPRA data · updated {generatedAt.slice(0, 10)}
            </span>
          </div>
          <nav className="hidden lg:flex items-center gap-0.5">
            {LINKS.map((l) => {
              const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    active
                      ? "bg-primary-700 text-white"
                      : "text-slate-600 hover:text-primary-700 hover:bg-primary-50"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {/* mobile nav */}
        <nav className="lg:hidden -mx-4 px-4 pb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "bg-primary-700 text-white border-primary-700"
                    : "bg-white text-slate-600 border-slate-200"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
