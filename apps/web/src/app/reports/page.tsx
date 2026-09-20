// /reports — "Nigeria fuel sector in numbers": monthly report index.
//
// Reports are deterministic renderings of the committed NMDPRA datasets
// (see scripts/generate-reports.mts). Same data → same report.

import type { Metadata } from "next";
import Link from "next/link";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ArrowUpRight } from "lucide-react";
import { IntelHeader } from "@/components/intel/bits";
import { Badge } from "@/components/shared/Badge";
import type { MonthlyReport } from "@fuellink/contracts";

export const metadata: Metadata = {
  title: "Monthly Reports",
  description:
    "Nigeria fuel sector in numbers — a deterministic monthly breakdown of refinery output, supply, consumption, sufficiency, prices, gas and trade, generated from NMDPRA fact sheets.",
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const label = (period: string) => {
  const [y, m] = period.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
};

function listReports(): MonthlyReport[] {
  const dir = path.join(process.cwd(), "src/data/reports");
  if (!readdirSync(dir).some((f) => f.endsWith(".json"))) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => b.localeCompare(a))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as MonthlyReport);
}

export default function ReportsIndex() {
  const reports = listReports();
  const latest = reports[0];

  return (
    <div>
      <IntelHeader
        title="Nigeria fuel sector in numbers"
        description="Every month, the same data you'll find across the Intelligence dashboards, rendered as one readable report: refinery output, supply and consumption, sufficiency, state prices, gas, and trade flows. Generated deterministically from NMDPRA fact sheets — no editorial, no estimates."
        asOf={latest ? label(latest.month) : undefined}
        source="NMDPRA monthly fact sheets (public PDFs)"
        sourceUrl="https://nmdpra.gov.ng/"
      />

      <div className="space-y-3">
        {reports.map((r, i) => (
          <Link
            key={r.month}
            href={`/reports/${r.month}`}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 transition-all sm:flex-row sm:items-center"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">
                  {label(r.month)}
                </h2>
                {i === 0 && (
                  <Badge variant="primary" size="sm">
                    latest
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">{r.highlights.map((h) => h.text).join(" ")}</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 text-xs text-slate-400">
              <span>{r.sections.length} sections</span>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {reports.length > 0 && (
        <p className="mt-4 text-xs text-slate-400">
          Reports regenerate automatically when the monthly ingest lands new fact sheets — the
          scheduled pipeline opens a pull request for every data change.
        </p>
      )}
    </div>
  );
}
