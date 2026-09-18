// FuelLink Intelligence — shared presentational bits (server-safe).

import Link from "next/link";
import { ArrowUpRight, Info, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

/* ------------------------------- header ---------------------------------- */

interface IntelHeaderProps {
  title: string;
  description: string;
  asOf?: string;
  source?: string;
  sourceUrl?: string;
  children?: React.ReactNode;
}

export function IntelHeader({ title, description, asOf, source, sourceUrl, children }: IntelHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant="primary" size="sm">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            FuelLink Intelligence
          </span>
        </Badge>
        {asOf && (
          <Badge variant="default" size="sm">
            as of {asOf}
          </Badge>
        )}
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-slate-600">{description}</p>
      {children}
      {source && (
        <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          Source:{" "}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-700 hover:underline underline-offset-2"
            >
              {source} <ArrowUpRight className="inline w-3 h-3" />
            </a>
          ) : (
            <span>{source}</span>
          )}
        </p>
      )}
    </div>
  );
}

/* -------------------------------- metric --------------------------------- */

export function Metric({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const tones = {
    default: "text-slate-900",
    good: "text-primary-600",
    warn: "text-secondary-600",
    bad: "text-danger-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-bold", tones[tone])}>{value}</p>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

/* -------------------------------- table ---------------------------------- */

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  isNull = false,
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  isNull?: boolean;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "px-3 py-2.5 text-sm border-t border-slate-100",
        isNull ? "text-slate-300 italic" : "text-slate-700",
        className
      )}
    >
      {children}
    </td>
  );
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-100">{children}</table>
    </div>
  );
}

/* ------------------------------- callouts -------------------------------- */

export function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl border p-3.5 text-sm",
        tone === "info" && "border-slate-200 bg-slate-50 text-slate-600",
        tone === "warn" && "border-amber-200 bg-amber-50 text-amber-800"
      )}
    >
      {tone === "warn" ? (
        <TriangleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
      ) : (
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
      )}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * "Derived" tag — used whenever a number is arithmetic over sourced values
 * (e.g. import = total − domestic), never a market estimate.
 */
export function Derived({ note }: { note?: string }) {
  return (
    <span
      title={note || "Computed by arithmetic from sourced figures — not an estimate."}
      className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 cursor-help"
    >
      derived
    </span>
  );
}

/** Placeholder for values NMDPRA did not report for the period. */
export function NR() {
  return (
    <span title="Not reported for this period" className="text-slate-300 italic text-sm">
      not reported
    </span>
  );
}

/* ------------------------------ source chip ------------------------------ */

export function SourceChip({ label, url }: { label: string; url: string }) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 hover:bg-primary-100 transition-colors"
    >
      {label}
      <ArrowUpRight className="w-3 h-3" />
    </Link>
  );
}
