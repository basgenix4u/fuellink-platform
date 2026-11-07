"use client";

import { ToastHost } from "@/components/ui/ToastHost";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  LogOut,
  Menu,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | null;
  exact?: boolean;
  locked?: boolean;
};

type DashboardShellProps = {
  nav: ShellNavItem[];
  children: ReactNode;
  workspace: { name: string; meta: string; tag?: string };
  user: { name: string; role: string };
  searchPlaceholder?: string;
  accent?: "brand" | "ember" | "indigo";
  banner?: ReactNode;
  settingsHref?: string;
};

const accents = {
  brand: { ring: "shadow-[0_0_0_1px_rgba(52,211,153,0.35)]", text: "text-emerald-300", bar: "#34d399" },
  ember: { ring: "shadow-[0_0_0_1px_rgba(251,146,60,0.35)]", text: "text-orange-300", bar: "#fb923c" },
  indigo: { ring: "shadow-[0_0_0_1px_rgba(129,140,248,0.38)]", text: "text-indigo-300", bar: "#818cf8" },
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardShell({
  nav,
  children,
  workspace,
  user,
  searchPlaceholder = "Search",
  accent = "brand",
  banner,
  settingsHref = "/",
}: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const tone = accents[accent];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (item: ShellNavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const primary = nav.filter((item) => !item.locked);
  const locked = nav.filter((item) => item.locked);

  const navBlock = (items: ShellNavItem[]) => (
    <div className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.locked ? settingsHref : item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "nav-item group relative flex h-10 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-medium",
              active
                ? "bg-white/[0.09] text-white"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
            )}
          >
            {active ? <span className="nav-active-bar" style={{ background: tone.bar }} /> : null}
            <item.icon
              className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                active ? "text-white" : "text-slate-500 group-hover:text-slate-200"
              )}
            />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge ? (
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  active ? "bg-white/15 text-white" : "bg-white/[0.07] text-slate-300"
                )}
              >
                {item.badge}
              </span>
            ) : null}
            {item.locked ? <span className="text-[9px] uppercase tracking-wider text-amber-400/80">pro</span> : null}
          </Link>
        );
      })}
    </div>
  );

  const sidebar = (
    <div className="relative flex h-full flex-col">
      <div className="pointer-events-none absolute inset-0 mesh-ink opacity-70" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 grid-lines-dark" aria-hidden />

      <div className="relative flex h-16 items-center justify-between px-4">
        <Logo variant="white" size="sm" className="press" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="press flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mx-3 mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">{workspace.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{workspace.meta}</p>
          </div>
          <span
            className={cn(
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-white/[0.07] text-[10px] font-semibold text-slate-200",
              tone.ring
            )}
          >
            {initialsOf(workspace.name)}
          </span>
        </div>
        {workspace.tag ? (
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium",
              tone.text
            )}
          >
            <span className="h-1 w-1 rounded-full bg-current" />
            {workspace.tag}
          </span>
        ) : null}
      </div>

      <nav className="relative scroll-thin-dark flex-1 overflow-y-auto px-3 pb-3" aria-label="Console">
        {banner ? <div className="mb-3">{banner}</div> : null}
        {navBlock(primary)}
        {locked.length > 0 ? (
          <>
            <p className="mt-4 mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Subscription
            </p>
            {navBlock(locked)}
          </>
        ) : null}
      </nav>

      <div className="relative border-t border-white/10 p-3">
        <div className="mb-2 space-y-0.5">
          <Link
            href="/intel"
            onClick={() => setOpen(false)}
            className="nav-item flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[12.5px] text-slate-400 hover:bg-white/[0.05] hover:text-white"
          >
            <CircleHelp className="h-4 w-4" />
            <span className="flex-1">Market intelligence</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="nav-item flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[12.5px] text-slate-400 hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="flex-1">Sign out</span>
          </Link>
        </div>

        <Link
          href={settingsHref}
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-2 transition-colors hover:bg-white/[0.07]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-[11px] font-semibold text-white">
            {initialsOf(user.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-medium text-white">{user.name}</span>
            <span className="block truncate text-[10.5px] text-slate-400">{user.role}</span>
          </span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#f7f8f7]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[264px] border-r border-white/10 glass-dark lg:block">
        {sidebar}
      </aside>

      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-[#04120b]/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[272px] border-r border-white/10 glass-dark transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebar}
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-[var(--hairline)] bg-white/85 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="press flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hairline)] text-slate-600 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800 sm:hidden">
              {workspace.name}
            </span>

            <div className="relative hidden min-w-0 flex-1 sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder={searchPlaceholder}
                className="h-9 w-full max-w-[340px] rounded-[10px] border border-transparent bg-slate-900/[0.035] pl-8 pr-3 text-[12.5px] text-slate-700 transition-colors placeholder:text-slate-400 hover:bg-slate-900/[0.05] focus:border-[var(--hairline-strong)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <span className="hidden items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 sm:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
              <button
                type="button"
                className="press relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-900/[0.05]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-secondary-500 ring-2 ring-white" />
              </button>
              <span className="mx-0.5 hidden h-5 w-px bg-[var(--hairline)] sm:block" />
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-[11px] font-semibold text-white">
                {initialsOf(user.name)}
              </span>
            </div>
          </div>
        </header>

        <main className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 mesh-brand opacity-60" aria-hidden />
          <div className="relative px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
            <div key={pathname} className="page-enter">
              {children}
            </div>
          </div>
        </main>
      </div>
      <ToastHost />
    </div>
  );
}
