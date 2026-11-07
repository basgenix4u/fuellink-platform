"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

const intel = [
  { href: "/intel/gantry", label: "Gantry prices", detail: "Depot-by-depot PMS, AGO, ATK" },
  { href: "/intel/lome", label: "Lomé index", detail: "Regional import parity" },
  { href: "/intel/sufficiency", label: "Sufficiency radar", detail: "Days of cover by state" },
  { href: "/intel/prices", label: "State price index", detail: "Pump price by state" },
  { href: "/intel/lpg", label: "LPG desk", detail: "Cooking gas market" },
  { href: "/intel/jet", label: "Jet A-1 desk", detail: "Aviation fuel" },
  { href: "/intel/arbitrage", label: "Arbitrage", detail: "Spread opportunities" },
  { href: "/intel/calculator", label: "Landed cost", detail: "Deterministic arithmetic" },
];

const depotLinks = [
  { href: "/depot", label: "Depot console" },
  { href: "/depot/inventory", label: "Inventory" },
  { href: "/depot/orders", label: "Orders" },
  { href: "/depot/analytics", label: "Analytics" },
  { href: "/register/depot", label: "List your depot" },
];

const marketerLinks = [
  { href: "/marketer", label: "Marketer workspace" },
  { href: "/marketer/depots", label: "Find depots" },
  { href: "/marketer/predictor", label: "Cost & spread" },
  { href: "/marketer/orders", label: "My orders" },
  { href: "/register/marketer", label: "Create account" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(top > 8);
      setProgress(height > 0 ? Math.min(100, (top / height) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 no-tap">
      <div
        className={`transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled ? "glass-nav shadow-[0_1px_0_rgba(5,19,12,0.06)]" : "bg-transparent"
        }`}
      >
        <div className="page-max page-x">
          <nav className="flex h-[60px] items-center gap-2 lg:h-[68px]" aria-label="Primary">
            <Link href="/" className="press flex items-center rounded-lg" aria-label="FuelLink home">
              <Logo size="sm" />
            </Link>

            <div className="mx-2 hidden items-center gap-0.5 lg:flex">
              <div className="group relative">
                <button
                  type="button"
                  className="press flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-700 hover:bg-slate-900/[0.04] hover:text-slate-900"
                  aria-haspopup="true"
                >
                  Intelligence
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-0 top-full w-[520px] translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="surface grid grid-cols-2 gap-1 p-2 shadow-[var(--shadow-lg)]">
                    {intel.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="press rounded-xl px-3 py-2.5 hover:bg-slate-900/[0.04]"
                      >
                        <div className="text-[13px] font-medium text-slate-900">{item.label}</div>
                        <div className="t-meta">{item.detail}</div>
                      </Link>
                    ))}
                    <Link
                      href="/intel"
                      className="press col-span-2 mt-1 flex items-center justify-between rounded-xl bg-[#04120b] px-3 py-2.5 text-[13px] font-medium text-white"
                    >
                      Open intelligence terminal
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <button
                  type="button"
                  className="press flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-700 hover:bg-slate-900/[0.04] hover:text-slate-900"
                  aria-haspopup="true"
                >
                  Exchange
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-0 top-full w-[420px] translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="surface grid grid-cols-2 gap-3 p-3 shadow-[var(--shadow-lg)]">
                    <div>
                      <p className="t-kicker mb-2 text-slate-400">Depots</p>
                      <div className="flex flex-col">
                        {depotLinks.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            className="press rounded-lg px-2 py-1.5 text-[13px] text-slate-700 hover:bg-slate-900/[0.04] hover:text-slate-900"
                          >
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="t-kicker mb-2 text-slate-400">Marketers</p>
                      <div className="flex flex-col">
                        {marketerLinks.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            className="press rounded-lg px-2 py-1.5 text-[13px] text-slate-700 hover:bg-slate-900/[0.04] hover:text-slate-900"
                          >
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/reports"
                className="press rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-700 hover:bg-slate-900/[0.04] hover:text-slate-900"
              >
                Reports
              </Link>
              <Link
                href="/intel/calculator"
                className="press rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-700 hover:bg-slate-900/[0.04] hover:text-slate-900"
              >
                Landed cost
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <Link
                href="/login"
                className="press hidden rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-700 hover:bg-slate-900/[0.04] hover:text-slate-900 sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/register/marketer"
                className="press group hidden items-center gap-1.5 rounded-xl bg-[#04120b] px-3.5 py-2 text-[13px] font-medium text-white shadow-[var(--shadow-sm)] hover:bg-[#0b2f1c] sm:flex"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="press flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--hairline)] bg-white/70 lg:hidden"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>

        <div
          aria-hidden
          className="h-px w-full origin-left bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 transition-transform duration-150"
          style={{ transform: `scaleX(${progress / 100})`, opacity: scrolled ? 1 : 0 }}
        />
      </div>

      <div
        id="mobile-nav"
        className={`fixed inset-x-0 top-[60px] z-40 origin-top overflow-y-auto border-t border-[var(--hairline)] bg-white transition-all duration-300 lg:hidden ${
          open
            ? "visible max-h-[calc(100dvh-60px)] opacity-100"
            : "invisible max-h-0 opacity-0"
        }`}
      >
        <div className="page-x safe-b space-y-6 py-6">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/intel"
              onClick={() => setOpen(false)}
              className="press surface-2 flex flex-col justify-between p-3"
            >
              <span className="t-kicker text-primary-600">Intelligence</span>
              <span className="mt-6 text-[15px] font-medium">Open terminal</span>
            </Link>
            <Link
              href="/reports"
              onClick={() => setOpen(false)}
              className="press surface-2 flex flex-col justify-between p-3"
            >
              <span className="t-kicker text-secondary-600">Reports</span>
              <span className="mt-6 text-[15px] font-medium">Monthly digest</span>
            </Link>
          </div>

          <div>
            <p className="t-kicker mb-2 text-slate-400">Market data</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {intel.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="press flex min-h-11 items-center rounded-lg px-1 text-[14px] text-slate-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="t-kicker mb-2 text-slate-400">Depots</p>
              {depotLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="press flex min-h-11 items-center text-[14px] text-slate-700"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div>
              <p className="t-kicker mb-2 text-slate-400">Marketers</p>
              {marketerLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="press flex min-h-11 items-center text-[14px] text-slate-700"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="press flex h-12 items-center justify-center rounded-xl border border-[var(--hairline-strong)] text-[14px] font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/register/marketer"
              onClick={() => setOpen(false)}
              className="press flex h-12 items-center justify-center rounded-xl bg-[#04120b] text-[14px] font-medium text-white"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
