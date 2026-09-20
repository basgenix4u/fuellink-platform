// src/app/admin/marketers/page.tsx

"use client";

import { useState } from "react";
import { Search, CheckCircle2, XCircle, MoreVertical, FileText } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import toast from "react-hot-toast";

const marketers = [
  { id: "MKT-001", business: "Sahara Energy", regNo: "RC-12345", contact: "Musa Ibrahim", status: "verified", volume: "1.2M L" },
  { id: "MKT-002", business: "Golden Oil", regNo: "RC-99882", contact: "Chukwu Emeka", status: "pending", volume: "0 L" },
];

export default function AdminMarketersPage() {
  const handleVerify = (id: string) => {
    toast.success("Marketer Verified Successfully");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Marketer Compliance</h1>
      
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Business Entity</th>
              <th className="px-6 py-4">RC Number</th>
              <th className="px-6 py-4">Contact Person</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {marketers.map((mkt) => (
              <tr key={mkt.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{mkt.business}</td>
                <td className="px-6 py-4 font-mono text-slate-500">{mkt.regNo}</td>
                <td className="px-6 py-4 text-slate-600">{mkt.contact}</td>
                <td className="px-6 py-4">
                  <Badge variant={mkt.status === "verified" ? "success" : "warning"}>{mkt.status}</Badge>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  {mkt.status === "pending" && (
                    <Button size="sm" variant="success" onClick={() => handleVerify(mkt.id)}>Verify</Button>
                  )}
                  <Button size="sm" variant="outline">View Docs</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}