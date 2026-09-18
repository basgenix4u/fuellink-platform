// src/app/admin/depots/[id]/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, FileText, Database, 
  History, AlertTriangle, ShieldAlert, BarChart, Download
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

// Detailed Mock Data
const depotData = {
  id: "DEP-001",
  name: "Pinnacle Oil & Gas Terminal",
  address: "Lekki Free Zone, Lagos",
  license: "LCN-2024-8892",
  expiry: "2026-12-31",
  status: "verified", // or 'pending', 'suspended'
  contact: { name: "John Doe", email: "manager@pinnacle.com", phone: "+234 800 000 0000" },
  tanks: [
    { id: "T1", product: "PMS", name: "Tank A (Main)", capacity: 20000000, level: 85, color: "bg-blue-500" },
    { id: "T2", product: "AGO", name: "Tank B", capacity: 15000000, level: 42, color: "bg-amber-500" },
    { id: "T3", product: "DPK", name: "Tank C", capacity: 10000000, level: 5, color: "bg-cyan-500", alert: true },
  ],
  documents: [
    { name: "NMDPRA License.pdf", date: "2024-01-10", status: "valid" },
    { name: "Fire Safety Cert.pdf", date: "2024-02-15", status: "valid" },
    { name: "Tank Calibration.pdf", date: "2023-11-20", status: "expiring_soon" },
  ]
};

export default function DepotDetailPage() {
  const [status, setStatus] = useState(depotData.status);

  const handleAction = (action: "approve" | "suspend") => {
    toast.loading("Processing regulatory action...");
    setTimeout(() => {
      toast.dismiss();
      if (action === "approve") {
        setStatus("verified");
        toast.success("Depot Verified & Live");
      } else {
        setStatus("suspended");
        toast.error("Depot Operations Suspended");
      }
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header with Navigation & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/depots" className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{depotData.name}</h1>
              <Badge variant={status === "verified" ? "success" : status === "suspended" ? "danger" : "warning"}>
                {status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-slate-500 flex items-center gap-2 text-sm mt-1">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{depotData.license}</span>
              <span>•</span>
              <span>{depotData.address}</span>
            </p>
          </div>
        </div>

        {/* Regulatory Actions */}
        <div className="flex gap-3">
          {status === "pending" && (
            <Button variant="success" onClick={() => handleAction("approve")}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Approve License
            </Button>
          )}
          {status === "verified" && (
            <Button variant="danger" onClick={() => handleAction("suspend")}>
              <ShieldAlert className="w-4 h-4 mr-2" /> Suspend Operations
            </Button>
          )}
          {status === "suspended" && (
            <Button variant="success" onClick={() => handleAction("approve")}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Reinstate License
            </Button>
          )}
        </div>
      </div>

      {/* TANK VISUALIZATION (The "See Everything" Feature) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {depotData.tanks.map((tank) => (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            key={tank.id} 
            className="bg-white rounded-2xl border border-slate-200 p-6 relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4 z-10 relative">
              <div>
                <Badge variant="outline" className="bg-slate-50">{tank.product}</Badge>
                <h3 className="font-bold text-slate-900 mt-2">{tank.name}</h3>
                <p className="text-xs text-slate-500">Cap: {formatNumber(tank.capacity)}L</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${tank.level < 20 ? 'text-red-600' : 'text-slate-900'}`}>
                  {tank.level}%
                </span>
                {tank.alert && <div className="flex items-center gap-1 text-red-600 text-xs font-bold mt-1"><AlertTriangle className="w-3 h-3" /> LOW STOCK</div>}
              </div>
            </div>

            {/* Liquid Animation */}
            <div className="relative h-32 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <div 
                className={cn("absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out opacity-80", tank.color)}
                style={{ height: `${tank.level}%` }}
              >
                {/* Wave effect overlay could go here */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/30" />
              </div>
              
              {/* Grid lines for measurement */}
              <div className="absolute inset-0 flex flex-col justify-between py-2 px-3 pointer-events-none">
                <div className="border-b border-slate-300/50 w-full h-0" />
                <div className="border-b border-slate-300/50 w-full h-0" />
                <div className="border-b border-slate-300/50 w-full h-0" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Compliance Documents */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Compliance Documents
          </h3>
          <div className="space-y-3">
            {depotData.documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-red-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-500">Uploaded: {doc.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={doc.status === 'valid' ? 'success' : 'warning'}>
                    {doc.status === 'valid' ? 'Valid' : 'Review Needed'}
                  </Badge>
                  <button className="text-slate-400 hover:text-indigo-600"><Download className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity / Audit Log */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" /> Audit Log
          </h3>
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 pl-6 py-2">
            {[
              { action: "Price Update", detail: "Changed PMS price to ₦890", time: "2 hours ago", user: "Depot Admin" },
              { action: "Stock Discharge", detail: "Added 500,000L to Tank A", time: "5 hours ago", user: "System" },
              { action: "Transaction", detail: "Processed 33,000L AGO order", time: "Yesterday", user: "System" },
            ].map((log, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-slate-300" />
                <p className="text-sm font-medium text-slate-900">{log.action}</p>
                <p className="text-xs text-slate-500">{log.detail}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{log.time}</span> • <span>{log.user}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}