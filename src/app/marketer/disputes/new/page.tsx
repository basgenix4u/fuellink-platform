// src/app/marketer/disputes/new/page.tsx

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Send,
  Shield,
  Info,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const disputeTypes = [
  {
    id: "short_loading",
    label: "Short Loading",
    description: "Loaded quantity was less than paid for",
    icon: "📉",
  },
  {
    id: "quality_issue",
    label: "Product Quality Issue",
    description: "Product color, density, or specification doesn't match",
    icon: "🧪",
  },
  {
    id: "payment_issue",
    label: "Payment/Settlement Issue",
    description: "Problem with escrow release or payment",
    icon: "💳",
  },
  {
    id: "delay",
    label: "Excessive Delay",
    description: "Unreasonable waiting time at depot",
    icon: "⏰",
  },
  {
    id: "unauthorized_charges",
    label: "Unauthorized Charges",
    description: "Additional fees charged outside platform",
    icon: "💰",
  },
  {
    id: "other",
    label: "Other Issue",
    description: "Any other problem not listed above",
    icon: "❓",
  },
];

function NewDisputeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    orderId: orderId,
    type: "",
    description: "",
    expectedResolution: "",
    evidence: [] as File[],
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.evidence.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }
    setFormData({ ...formData, evidence: [...formData.evidence, ...files] });
  };

  const removeFile = (index: number) => {
    setFormData({
      ...formData,
      evidence: formData.evidence.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      toast.error("Please select a dispute type");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("Dispute submitted successfully. NMDPRA will review within 48 hours.");
    router.push("/marketer/disputes");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketer/disputes"
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">File a Dispute</h1>
          <p className="text-slate-500">Report an issue for NMDPRA review</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">How Disputes Work</p>
            <p className="text-sm text-blue-700 mt-1">
              All disputes are reviewed by NMDPRA (Nigerian Midstream and Downstream 
              Petroleum Regulatory Authority). Both parties will be contacted, and 
              a resolution will typically be provided within 48-72 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order ID */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Order Number
          </label>
          <input
            type="text"
            value={formData.orderId}
            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
            placeholder="ORD-2025-XXXXXX"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-2">
            Enter the order number related to this dispute
          </p>
        </div>

        {/* Dispute Type */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Type of Issue *
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {disputeTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.id })}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  formData.type === type.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <p className="font-medium text-slate-900">{type.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Describe the Issue *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Please provide detailed information about what happened..."
            rows={5}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            Be as specific as possible. Include dates, times, names, and quantities.
          </p>
        </div>

        {/* Expected Resolution */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Expected Resolution
          </label>
          <textarea
            value={formData.expectedResolution}
            onChange={(e) => setFormData({ ...formData, expectedResolution: e.target.value })}
            placeholder="What outcome would resolve this issue for you?"
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Evidence Upload */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Upload Evidence (Optional)
          </label>

          {/* Upload Area */}
          <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="font-medium text-slate-700">Click to upload files</p>
            <p className="text-sm text-slate-500 mt-1">
              Images, PDFs, or documents (max 5 files, 10MB each)
            </p>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Uploaded Files */}
          {formData.evidence.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.evidence.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="w-5 h-5 text-slate-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-slate-500" />
                    )}
                    <span className="text-sm text-slate-700 truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <Badge variant="default" size="sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NMDPRA Notice */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">NMDPRA Regulated</p>
              <p className="text-sm text-amber-700 mt-1">
                By submitting this dispute, you confirm that all information provided is 
                accurate and truthful. False claims may result in account suspension and 
                regulatory action.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Link href="/marketer/disputes" className="flex-1">
            <Button variant="outline" size="lg" fullWidth>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
            isLoading={isSubmitting}
            loadingText="Submitting..."
            leftIcon={<Send className="w-5 h-5" />}
          >
            Submit Dispute
          </Button>
        </div>
      </form>
    </div>
  );
}
export default function NewDisputePage() {
  return (
    <Suspense>
      <NewDisputeContent />
    </Suspense>
  );
}
