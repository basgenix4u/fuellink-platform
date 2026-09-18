// src/app/admin/depots/page.tsx

"use client";

import Link from "next/link";
import { Search, Filter, MoreVertical, Fuel, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";

const depots = [
  { id: "DEP-001", name: "Pinnacle Oil & Gas", location: "Lekki, Lagos", license: "LCN-8821", status: "verified", stock: 85, alert: false },
  { id: "DEP-002", name: "Matrix Energy", location: "Warri, Delta", license: "LCN-9932", status: "verified", stock: 12, alert: true }, // Low stock
  { id: "DEP-003", name: "Rainoil Ltd", location: "Ijegun, Lagos", license: "PENDING", status: "pending", stock: 0, alert: false },
];

export default function AdminDepotsList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Depot Oversight</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
          <Button variant="primary" size="sm">Add Depot Manual</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Search depots..." />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Facility Name</th>
              <th className="px-6 py-4 font-medium">Location</th>
              <th className="px-6 py-4 font-medium">License Status</th>
              <th className="px-6 py-4 font-medium">Avg. Stock Level</th>
              <th className="px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {depots.map((depot) => (
              <tr key={depot.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                      {depot.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{depot.name}</div>
                      <div className="text-xs text-slate-500">{depot.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{depot.location}</td>
                <td className="px-6 py-4">
                  <Badge variant={depot.status === "verified" ? "success" : "warning"}>
                    {depot.status === "verified" ? "Licensed" : "Pending Review"}
                  </Badge>
                  {depot.status === "verified" && <div className="text-xs text-slate-400 mt-1 font-mono">{depot.license}</div>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${depot.stock < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${depot.stock}%` }} 
                      />
                    </div>
                    <span className={`text-xs font-bold ${depot.stock < 20 ? 'text-red-600' : 'text-slate-600'}`}>
                      {depot.stock}%
                    </span>
                    {depot.alert && <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/admin/depots/${depot.id}`}>
                    <Button variant="outline" size="sm">Monitor</Button>
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