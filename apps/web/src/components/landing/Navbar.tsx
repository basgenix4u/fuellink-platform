"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronRight,
  FileText,
  Building2,
  ShoppingCart,
  Menu,
  Search,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";

type NavLink = { href: string; label: string; detail?: string };
type NavGroup = { id: string; label: string; icon: typeof Activity; links: NavLink[] };

const intel: NavLink[] = [
  { href: "/intel/gantry", label: "Gantry prices", detail: "PMS, AGO, ATK by depot" },
  { href: "/intel/sufficiency", label: "Days of cover", detail: "National stock runway" },
  { href: "/intel/lome", label: "Lomé index", detail: "Regional import parity" },
  { href: "/intel/prices", label: "State price index", detail: "Pump price by state" },
  { href: "/intel/lpg", label: "LPG desk", detail: "Cooking gas market" },
  { href: "/intel/jet", label: "Jet A-1 desk", detail: "Aviation fuel" },
  { href: "/intel/arbitrage", label: "Arbitrage", detail: "Spread opportunities" },
];

const depotLinks: NavLink[] = [
  { href: "/depot", label: "Depot console" },
  { href: "/depot/inventory", label: "Inventory" },
  { href: "/depot/orders", label: "Orders" },
  { href: "/depot/analytics", label: "Analytics" },
  { href: "/register/depot", label: "List your depot" },
];

const marketerLinks: NavLink[] = [
  { href: "/marketer", label: "Marketer workspace" },
  { href: "/marketer/depots", label: "Find depots" },
  { href: "/marketer/predictor", label: "Cost & spread" },
  { href: "/marketer/orders", label: "My orders" },
  { href: "/register/marketer", label: "Create account" },
];

const primaryLinks = [
  { href: "/intel", label: "Intelligence terminal", detail: "Regulator-sourced market data", icon: Activity },
  { href: "/reports", label: "Monthly reports", detail: "NMDPRA fact sheets, parsed", icon: FileText },
  { href: "/intel/calculator", label: "Landed cost", detail: "Deterministic arithmetic", icon: Calculator },
];

const groups: NavGroup[] = [
  { id: "data", label: "Market data", icon: Activity, links: intel },
  { id: "depots", label: "Depots", icon: Building2, links: depotLinks },
  { id: "marketers", label: "Marketers", icon: ShoppingCart, links: marketerLinks },
];

type MarketProps = { lagos: string; abuja: string; month: string };

export function Navbar({
  market = { lagos: "—", abuja: "—", month: "—" },
}: {
  market?: MarketProps;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [query, setQuery] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

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
      if (event.key !== "Escape") return;
      setOpen(false);
      setQuery("");
      setOpenGroup(null);
      triggerRef.current?.focus();
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

  useEffect(() => {
    if (!open) return;
    const focus = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(focus);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusables = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((node) => node.offsetParent !== null && !node.closest("[inert]"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setOpenGroup(null);
    triggerRef.current?.focus();
  };

  const results = query.trim().length > 0
    ? groups
        .flatMap((group) =>
          group.links.map((link) => ({ ...link, group: group.label }))
        )
        .filter((link) =>
          `${link.label} ${link.detail ?? ""} ${link.group}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        )
    : [];

  return (
    <header className="fixed inset-x-0 top-0 z-50 no-tap">
      <div
        className={`transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled ? "glass-nav shadow-[0_1px_0_rgba(5,19,12,0.06)]" : "bg-transparent"
        }`}
      >
        <div className="page-max page-x">
          <nav className="flex h-[60px] items-center gap-2 lg:h-[68px]" aria-label="Primary">
            <Logo size="sm" className="press rounded-lg" />

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
                    {[...intel, { href: "/intel/calculator", label: "Landed cost", detail: "Deterministic arithmetic" }].map((item) => (
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
                ref={triggerRef}
                type="button"
                onClick={() => (open ? close() : setOpen(true))}
                className="press flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--hairline)] bg-white/80 text-slate-700 lg:hidden"
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
        aria-hidden
        onClick={close}
        className={`fixed inset-0 top-[60px] z-30 bg-[#04120b]/35 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        ref={sheetRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed inset-x-0 bottom-0 top-[60px] z-40 flex flex-col border-t border-[var(--hairline)] bg-white transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <div className="border-b border-[var(--hairline)] px-4 pb-3 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search FuelLink"
              aria-label="Search navigation"
              className="h-11 w-full rounded-xl border border-[var(--hairline)] bg-[#f7f8f7] pl-9 pr-9 text-[14px] text-slate-800 placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden focus:border-primary-500/30 focus:bg-white focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="press absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-900/[0.06] hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="scroll-thin fade-b flex-1 overflow-y-auto overscroll-contain px-4 pb-5">
          {query.trim().length > 0 ? (
            <div className="pt-3">
              <p className="t-kicker mb-2 text-slate-400">
                {results.length} result{results.length === 1 ? "" : "s"}
              </p>
              {results.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--hairline-strong)] px-4 py-8 text-center">
                  <p className="text-[13.5px] font-medium text-slate-700">Nothing matched</p>
                  <p className="t-meta mt-1">Try “gantry”, “orders” or “reports”.</p>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {results.map((item) => (
                    <li key={`${item.group}-${item.href}-${item.label}`}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className="press flex min-h-12 items-center gap-3 rounded-xl px-2 hover:bg-slate-900/[0.04]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-slate-900">
                            {item.label}
                          </span>
                          <span className="block truncate text-[11.5px] text-slate-500">
                            {item.group}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex min-h-full flex-col">
              <Link
                href="/intel"
                onClick={close}
                className="press mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-[var(--hairline)] bg-[#f7f8f7] px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11.5px] font-medium text-slate-700">Live market</span>
                </span>
                <span className="flex items-center gap-2.5 text-[11.5px] text-slate-600">
                  <span>
                    Lagos <span className="tnum font-semibold text-slate-900">₦{market.lagos}</span>
                  </span>
                  <span>
                    Abuja <span className="tnum font-semibold text-slate-900">₦{market.abuja}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                </span>
              </Link>

              <div className="mt-4 space-y-1">
                {primaryLinks.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    style={open ? { animationDelay: `${index * 45}ms` } : undefined}
                    className={`press flex min-h-[56px] items-center gap-3 rounded-xl px-2 hover:bg-slate-900/[0.04] ${
                      open ? "rise" : ""
                    }`}
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-medium text-slate-900">{item.label}</span>
                      <span className="block truncate text-[11.5px] text-slate-500">{item.detail}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
                  </Link>
                ))}
              </div>

              <div className="mt-3 border-t border-[var(--hairline)]">
                {groups.map((group) => {
                  const expanded = openGroup === group.id;
                  return (
                    <div key={group.id} className="border-b border-[var(--hairline)]">
                      <button
                        type="button"
                        onClick={() => setOpenGroup(expanded ? null : group.id)}
                        aria-expanded={expanded}
                        aria-controls={`group-${group.id}`}
                        className="press flex min-h-[52px] w-full items-center gap-3 px-2 text-left"
                      >
                        <group.icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span className="flex-1 text-[14px] font-medium text-slate-900">{group.label}</span>
                        <span className="tnum text-[11px] text-slate-400">{group.links.length}</span>
                        <ChevronDown
                          className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-300 ${
                            expanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <div
                        id={`group-${group.id}`}
                        inert={!expanded}
                        className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <ul className="pb-2 pl-7">
                            {group.links.map((link) => (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  onClick={close}
                                  className="press flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 text-[13.5px] text-slate-600 hover:bg-slate-900/[0.04] hover:text-slate-900"
                                >
                                  <span className="truncate">{link.label}</span>
                                  {link.detail ? (
                                    <span className="hidden flex-shrink-0 text-[11px] text-slate-400 sm:block">
                                      {link.detail}
                                    </span>
                                  ) : null}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-3">
              <Link
                href="/intel"
                onClick={close}
                className="press block rounded-xl border border-[var(--hairline)] bg-gradient-to-br from-white to-[#f2f7f4] p-3"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-700 text-white">
                    <Activity className="h-3.5 w-3.5" />
                  </span>
                  <span className="t-kicker text-primary-700">Source ledger</span>
                </span>
                <span className="mt-1.5 block text-[12px] leading-snug text-slate-600">
                  Every price traced to an NMDPRA document, refreshed monthly. Latest dataset{" "}
                  {market.month}.
                </span>
              </Link>
              </div>
            </div>
          )}
        </div>

        <div className="safe-b flex-shrink-0 border-t border-[var(--hairline)] bg-white/95 px-4 pb-3 pt-3 backdrop-blur">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={close}
              className="press flex h-12 items-center justify-center rounded-xl border border-[var(--hairline-strong)] text-[14px] font-medium text-slate-800 active:bg-slate-900/[0.04]"
            >
              Sign in
            </Link>
            <Link
              href="/register/marketer"
              onClick={close}
              className="press flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[#04120b] text-[14px] font-medium text-white"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            Regulator-sourced data · Escrow held by a licensed bank
          </p>
        </div>
      </div>
    </header>
  );
}
