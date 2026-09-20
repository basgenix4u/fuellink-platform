// /reports/[month] — one deterministic monthly report.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ArrowLeft } from "lucide-react";
import type { MonthlyReport, ReportSection } from "@fuellink/contracts";
import { Note, TableShell, Th, Td } from "@/components/intel/bits";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const label = (period: string) => {
  const [y, m] = period.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
};

function readReport(month: string): MonthlyReport | null {
  const file = path.join(process.cwd(), "src/data/reports", `${month}.json`);
  try {
    return JSON.parse(readFileSync(file, "utf8")) as MonthlyReport;
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  const dir = path.join(process.cwd(), "src/data/reports");
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({ month: f.replace(".json", "") }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const { month } = await params;
  const report = readReport(month);
  if (!report) return { title: "Report not found" };
  return {
    title: report.title,
    description: report.description,
    openGraph: {
      title: report.title,
      description: report.description,
      type: "article",
      publishedTime: `${month}-01T00:00:00Z`,
    },
  };
}

const TONE_DOT: Record<string, string> = {
  neutral: "bg-slate-400",
  good: "bg-primary-500",
  warn: "bg-secondary-500",
  bad: "bg-danger-500",
};

function Section({ section }: { section: ReportSection }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">{section.heading}</h2>
      {section.bullets.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-slate-600 leading-relaxed">
              <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", TONE_DOT[b.tone] ?? TONE_DOT.neutral)} />
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
      )}
      {section.table && (
        <TableShell>
          <thead>
            <tr>
              {section.table.headers.map((h) => (
                <Th key={h} className={h === section.table!.headers[0] ? "" : "text-right"}>
                  {h}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.table.rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                {row.map((cell, j) => (
                  <Td
                    key={j}
                    className={j === 0 ? "font-medium text-slate-900" : "text-right"}
                    isNull={cell === "not reported"}
                  >
                    {cell === "not reported" ? "—" : cell}
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
      {section.table?.caption && (
        <p className="mt-2 text-xs text-slate-400">{section.table.caption}</p>
      )}
      {section.note && (
        <div className="mt-3">
          <Note>{section.note}</Note>
        </div>
      )}
    </section>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  if (!/^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(month)) notFound();
  const report = readReport(month);
  if (!report) notFound();

  const sorted = [...report.sections];

  return (
    <div className="max-w-3xl">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-700 transition-colors mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All reports
      </Link>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant="primary" size="sm">Monthly report</Badge>
        <Badge variant="default" size="sm">deterministic · NMDPRA-sourced</Badge>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{report.title}</h1>
      <p className="mt-2 text-slate-600">{report.description}</p>
      <p className="mt-2 text-xs text-slate-400">
        Generated {report.generatedAt.slice(0, 10)} from the NMDPRA fact sheet for {label(month)}.
      </p>

      {/* highlights */}
      <div className="mt-6 rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-primary-700 mb-3">This month in numbers</p>
        <ul className="space-y-2">
          {report.highlights.map((h, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
              <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", TONE_DOT[h.tone] ?? TONE_DOT.neutral)} />
              <span>{h.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        {sorted.map((s) => (
          <Section key={s.id} section={s} />
        ))}
      </div>

      {/* sources + methodology */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900 text-sm mb-3">Sources & method</h2>
        <ul className="space-y-1.5">
          {report.sources.map((src) => (
            <li key={src.label} className="text-xs text-slate-500">
              {src.url.startsWith("/") ? (
                <Link href={src.url} className="text-primary-700 hover:underline">
                  {src.label}
                </Link>
              ) : (
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">
                  {src.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
          Every figure in this report is a value published by NMDPRA in the fact sheet above or an
          attributed market source. Values NMDPRA did not report render as &ldquo;not reported&rdquo;
          (shown as —). Figures labelled &ldquo;derived&rdquo; are arithmetic over published values
          (e.g. month-on-month changes, share of benchmark). This report is generated automatically
          and is informational; it is not trading advice.
        </p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/intel"
          className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
        >
          Explore the full Intelligence layer →
        </Link>
        <Link
          href="/intel/sufficiency"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Sufficiency radar
        </Link>
      </div>
    </div>
  );
}
