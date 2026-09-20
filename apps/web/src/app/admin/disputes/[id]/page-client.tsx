// src/app/admin/disputes/[id]/page.tsx

"use client";

import { useState } from "react";
import { 
  ArrowLeft, FileText, MessageSquare, Scale, 
  CheckCircle2, XCircle, Download, ShieldAlert, User
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import toast from "react-hot-toast";

const caseData = {
  id: "DSP-2025-001",
  type: "Short Loading",
  status: "under_review",
  description: "We ordered and paid for 33,000 Litres of AGO. Upon arrival and dipping at our station, the truck only contained 31,500 Litres. The depot claims full loading.",
  evidence: [
    { name: "Waybill.pdf", type: "doc" },
    { name: "Dip_Measurement_Photo.jpg", type: "image" },
  ],
  complainant: { name: "Sahara Energy", role: "Marketer", contact: "Musa Ibrahim" },
  defendant: { name: "Pinnacle Oil", role: "Depot", contact: "Depot Manager" },
  timeline: [
    { event: "Dispute Filed", time: "2025-02-19 10:00 AM", user: "Sahara Energy" },
    { event: "Evidence Uploaded", time: "2025-02-19 10:05 AM", user: "Sahara Energy" },
    { event: "Under Review", time: "2025-02-19 11:30 AM", user: "Admin System" },
  ]
};

export default function DisputeDetailPage() {
  const [ruling, setRuling] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleRuling = (decision: "uphold" | "dismiss") => {
    if (!ruling) return toast.error("Please enter a ruling explanation");
    setProcessing(true);
    setTimeout(() => {
      toast.success(`Case ${decision === "uphold" ? "Upheld" : "Dismissed"} Successfully`);
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/disputes" className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Case #{caseData.id}</h1>
            <Badge variant="warning">Under Review</Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">Issue Type: {caseData.type}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content: Details & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" /> Case Details
            </h3>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {caseData.description}
            </p>
            
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Submitted Evidence</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {caseData.evidence.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        {file.type === 'doc' ? <FileText className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{file.name}</span>
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600"><Download className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Adjudication Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-500" /> Admin Ruling
            </h3>
            <textarea
              className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
              placeholder="Enter official ruling reasoning and instructions..."
              value={ruling}
              onChange={(e) => setRuling(e.target.value)}
            />
            <div className="flex gap-4 mt-4">
              <Button 
                variant="success" 
                className="flex-1" 
                onClick={() => handleRuling("uphold")}
                isLoading={processing}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Uphold Complaint (Refund)
              </Button>
              <Button 
                variant="danger" 
                className="flex-1" 
                onClick={() => handleRuling("dismiss")}
                isLoading={processing}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Dismiss Case
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar: Parties & Timeline */}
        <div className="space-y-6">
          {/* Parties Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Parties Involved</h3>
            <div className="space-y-4 relative">
              {/* Connector Line */}
              <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-slate-100" />
              
              <div className="relative flex gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 z-10 ring-4 ring-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Complainant</p>
                  <p className="font-bold text-slate-900">{caseData.complainant.name}</p>
                  <p className="text-xs text-slate-500">{caseData.complainant.role}</p>
                </div>
              </div>

              <div className="relative flex gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 z-10 ring-4 ring-white">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Defendant</p>
                  <p className="font-bold text-slate-900">{caseData.defendant.name}</p>
                  <p className="text-xs text-slate-500">{caseData.defendant.role}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <Button variant="outline" fullWidth leftIcon={<MessageSquare className="w-4 h-4" />}>
                Open Joint Chat
              </Button>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Case Timeline</h3>
            <div className="space-y-4">
              {caseData.timeline.map((event, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">{event.event}</p>
                    <p className="text-xs text-slate-500">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}