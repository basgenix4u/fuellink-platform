// src/app/admin/disputes/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  AlertOctagon, CheckCircle2, Clock, Filter, 
  Search, Eye, MessageSquare, Gavel
} from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";

const disputes = [
  {
    id: "DSP-2025-001",
    type: "Short Loading",
    priority: "high",
    complainant: "Sahara Energy",
    defendant: "Pinnacle Oil",
    orderId: "ORD-123456",
    status: "under_review",
    date: "2 hours ago",
  },
  {
    id: "DSP-2025-002",
    type: "Product Quality",
    priority: "critical",
    complainant: "Matrix Energy",
    defendant: "MRS Oil",
    orderId: "ORD-998877",
    status: "pending",
    date: "5 hours ago",
  },
  {
    id: "DSP-2025-003",
    type: "Payment Delay",
    priority: "medium",
    complainant: "Golden Oil",
    defendant: "Rainoil",
    orderId: "ORD-445566",
    status: "resolved",
    date: "1 day ago",
  },
];

export default function AdminDisputesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispute Resolution</h1>
          <p className="text-slate-500">Manage conflicts and enforce compliance</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Under Review</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>

      {/* Case Board */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Case ID</th>
              <th className="px-6 py-4">Type & Priority</th>
              <th className="px-6 py-4">Parties Involved</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {disputes.map((dispute) => (
              <tr key={dispute.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{dispute.id}</div>
                  <div className="text-xs text-slate-500">{dispute.date}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{dispute.type}</div>
                  <Badge variant={dispute.priority === "critical" ? "danger" : dispute.priority === "high" ? "warning" : "default"} size="sm" className="mt-1">
                    {dispute.priority.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-slate-600">From: <span className="font-semibold">{dispute.complainant}</span></span>
                    <span className="text-slate-400">Against: {dispute.defendant}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={
                    dispute.status === "resolved" ? "success" : 
                    dispute.status === "pending" ? "danger" : "warning"
                  }>
                    {dispute.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/admin/disputes/${dispute.id}`}>
                    <Button size="sm" variant="outline" leftIcon={<Gavel className="w-4 h-4" />}>Adjudicate</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}