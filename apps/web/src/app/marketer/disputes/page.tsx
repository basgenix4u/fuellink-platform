// src/app/marketer/disputes/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  Filter,
  Search,
  FileText,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Dispute {
  id: string;
  orderId: string;
  type: string;
  typeLabel: string;
  description: string;
  status: "pending" | "under_review" | "resolved" | "escalated" | "closed";
  createdAt: string;
  updatedAt: string;
  depot: {
    name: string;
  };
  nmdpraRef?: string;
  resolution?: string;
}

const mockDisputes: Dispute[] = [
  {
    id: "DSP-001",
    orderId: "ORD-2025-001234",
    type: "short_loading",
    typeLabel: "Short Loading",
    description: "Loaded 31,500L instead of 33,000L ordered. Difference of 1,500L.",
    status: "under_review",
    createdAt: "2025-02-18T10:00:00Z",
    updatedAt: "2025-02-19T08:00:00Z",
    depot: { name: "Pinnacle Oil & Gas" },
    nmdpraRef: "NMDPRA-2025-0456",
  },
  {
    id: "DSP-002",
    orderId: "ORD-2025-001198",
    type: "quality_issue",
    typeLabel: "Product Quality Issue",
    description: "AGO color was dark amber instead of clear straw. Suspected contamination.",
    status: "resolved",
    createdAt: "2025-02-15T14:00:00Z",
    updatedAt: "2025-02-17T16:00:00Z",
    depot: { name: "Matrix Energy Depot" },
    nmdpraRef: "NMDPRA-2025-0398",
    resolution: "Depot agreed to compensate ₦450,000 for quality difference. Credited to wallet.",
  },
  {
    id: "DSP-003",
    orderId: "ORD-2025-001156",
    type: "delay",
    typeLabel: "Excessive Delay",
    description: "Truck waited for 8 hours before loading. Incurred demurrage costs.",
    status: "pending",
    createdAt: "2025-02-19T06:00:00Z",
    updatedAt: "2025-02-19T06:00:00Z",
    depot: { name: "Oando Supply Terminal" },
  },
];

const statusConfig = {
  pending: {
    label: "Pending Review",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  under_review: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-700",
    icon: Eye,
  },
  resolved: {
    label: "Resolved",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  escalated: {
    label: "Escalated",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
  closed: {
    label: "Closed",
    color: "bg-slate-100 text-slate-700",
    icon: XCircle,
  },
};

export default function DisputesPage() {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDisputes = mockDisputes.filter((dispute) => {
    const matchesFilter = filter === "all" || dispute.status === filter;
    const matchesSearch =
      dispute.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.typeLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.depot.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disputes</h1>
          <p className="text-slate-500">
            Track and manage your dispute reports to NMDPRA
          </p>
        </div>
        <Link href="/marketer/disputes/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            File New Dispute
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-500">Total Disputes</p>
          <p className="text-2xl font-bold text-slate-900">{mockDisputes.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            {mockDisputes.filter((d) => d.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-500">Under Review</p>
          <p className="text-2xl font-bold text-blue-600">
            {mockDisputes.filter((d) => d.status === "under_review").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="text-2xl font-bold text-emerald-600">
            {mockDisputes.filter((d) => d.status === "resolved").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, type, or depot..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {["all", "pending", "under_review", "resolved"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                  filter === status
                    ? "bg-primary-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {status === "all"
                  ? "All"
                  : status === "under_review"
                  ? "Under Review"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.map((dispute, index) => {
          const statusInfo = statusConfig[dispute.status];
          const StatusIcon = statusInfo.icon;

          return (
            <motion.div
              key={dispute.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Dispute Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-900">{dispute.id}</span>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="outline">{dispute.typeLabel}</Badge>
                    <span className="text-slate-400">•</span>
                    <span className="text-sm text-slate-600">Order: {dispute.orderId}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-sm text-slate-600">{dispute.depot.name}</span>
                  </div>

                  <p className="text-slate-700 text-sm mb-3 line-clamp-2">
                    {dispute.description}
                  </p>

                  {dispute.nmdpraRef && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        NMDPRA Ref: <strong>{dispute.nmdpraRef}</strong>
                      </span>
                    </div>
                  )}

                  {dispute.resolution && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-sm text-emerald-800">
                        <strong>Resolution:</strong> {dispute.resolution}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Actions & Time */}
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Filed {formatRelativeTime(dispute.createdAt)}
                    </p>
                    {dispute.updatedAt !== dispute.createdAt && (
                      <p className="text-xs text-slate-400">
                        Updated {formatRelativeTime(dispute.updatedAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/marketer/disputes/${dispute.id}`}>
                      <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                        View Details
                      </Button>
                    </Link>
                    {dispute.status !== "resolved" && dispute.status !== "closed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<MessageSquare className="w-4 h-4" />}
                      >
                        Add Comment
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredDisputes.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No disputes found</h3>
          <p className="text-slate-500 mb-4">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "You haven't filed any disputes yet"}
          </p>
          <Link href="/marketer/disputes/new">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              File New Dispute
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}