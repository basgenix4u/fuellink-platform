"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, Activity } from "lucide-react";
import { cn, normalizePath } from "@/lib/utils";

const LINKS: { label: string; href: string; exact?: boolean }[] = [
  { label: "Overview", href: "/intel", exact: true },
  { label: "Gantry", href: "/intel/gantry" },
  { label: "Sufficiency", href: "/intel/sufficiency" },
  { label: "Lomé", href: "/intel/lome" },
  { label: "State prices", href: "/intel/prices" },
  { label: "Calculator", href: "/intel/calculator" },
  { label: "Arbitrage", href: "/intel/arbitrage" },
  { label: "LPG", href: "/intel/lpg" },
  { label: "Jet A-1", href: "/intel/jet" },
];

export function IntelNav({ generatedAt }: { generatedAt: string }) {
  const pathname = normalizePath(usePathname());
  const railRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!rail || !active) return;
    rail.scrollLeft = active.offsetLeft - (rail.clientWidth - active.clientWidth) / 2;
  }, [pathname]);

  return (
    <div className="relative border-b border-white/10 bg-[#04120b]">
      <div aria-hidden className="pointer-events-none absolute inset-0 mesh-ink opacity-90" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-16 grid-lines-dark" />

      <div className="relative page-max page-x">
        <div className="flex h-14 items-center gap-3">
          <Link
            href="/"
            className="press flex flex-shrink-0 items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            FuelLink
          </Link>
          <span className="text-white/15">/</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold text-white">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            Intelligence
          </span>

          <span
            title={`Data generated ${generatedAt} by the automated NMDPRA ingest. Refreshed monthly; every value is a published figure.`}
            className="ml-1 hidden cursor-help items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10.5px] font-medium text-emerald-300 md:inline-flex"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            NMDPRA · {generatedAt.slice(0, 10)}
          </span>

          <nav className="ml-auto hidden items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-1 lg:flex">
            {LINKS.map((link) => {
              const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                    active
                      ? "bg-white text-[#04120b] shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/reports"
            className="press ml-auto hidden h-8 items-center rounded-lg border border-white/15 bg-white/[0.06] px-3 text-[12px] font-medium text-white hover:bg-white/[0.12] lg:ml-2 lg:inline-flex"
          >
            Reports
          </Link>
        </div>

        <nav
          ref={railRef}
          aria-label="Intelligence sections"
          className="edge-fade-x scroll-thin -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:hidden"
        >
          {LINKS.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex-shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  active
                    ? "border-white bg-white text-[#04120b]"
                    : "border-white/12 bg-white/[0.04] text-slate-300"
                )}
              >
                {link.label}
              </Link>
            );
            <Link
              href="/reports"
              className="flex-shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-slate-300 transition-colors"
            >
              Reports
            </Link>
          })}
        </nav>
      </div>
    </div>
  );
}
