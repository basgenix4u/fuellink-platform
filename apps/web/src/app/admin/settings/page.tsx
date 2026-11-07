"use client";

import { ShieldCheck, Bell, FileCheck2, Users, Landmark } from "lucide-react";
import { Badge } from "@/components/shared/Badge";

const rows = [
  {
    icon: ShieldCheck,
    title: "Regulator access",
    detail: "NMDPRA compliance desk · read/write on depot records",
    state: "Active",
  },
  {
    icon: FileCheck2,
    title: "Licence verification feed",
    detail: "Synced with the NMDPRA licence register every 24 hours",
    state: "Synced",
  },
  {
    icon: Landmark,
    title: "Escrow oversight",
    detail: "Providus Bank settlement statements, monthly reconciliation",
    state: "Monthly",
  },
  {
    icon: Users,
    title: "Oversight team",
    detail: "3 seats · Compliance desk, Licensing, Enforcement",
    state: "3 seats",
  },
  {
    icon: Bell,
    title: "Alert thresholds",
    detail: "Stock cover below 7 days · price moves beyond 4% week on week",
    state: "Enabled",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="t-h2 text-slate-900">Oversight settings</h1>
        <p className="text-slate-500">Access, verification feeds and alerting for the regulator desk.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-3">
          <p className="t-kicker text-slate-500">Workspace configuration</p>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.title} className="flex items-start gap-3 px-4 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <row.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-slate-900">{row.title}</p>
                <p className="text-[12.5px] leading-relaxed text-slate-500">{row.detail}</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {row.state}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
        <p className="text-[12.5px] leading-relaxed text-indigo-900">
          Oversight actions are logged against the operator seat and retained for 24 months. Dataset
          refreshes remain automated from NMDPRA fact sheets and are never edited manually.
        </p>
      </div>
    </div>
  );
}
