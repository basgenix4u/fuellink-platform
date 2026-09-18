// src/app/marketer/refineries/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Factory,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";

const refineries = [
  {
    id: "ref-001",
    name: "Dangote Refinery",
    location: "Lekki Free Trade Zone, Lagos",
    status: "active",
    capacity: "650,000 bpd",
    logo: "/images/refineries/dangote.png",
    description: "Africa's largest single-train refinery, designed to meet Nigeria's refined petroleum needs.",
    products: [
      { type: "AGO", price: 1120, previousPrice: 1115, availability: "available", lastUpdated: "2025-02-19T06:00:00Z" },
      { type: "PMS", price: 860, previousPrice: 855, availability: "available", lastUpdated: "2025-02-19T06:00:00Z" },
      { type: "DPK", price: 1050, previousPrice: 1050, availability: "available", lastUpdated: "2025-02-19T06:00:00Z" },
      { type: "JET_A1", price: 1180, previousPrice: 1175, availability: "available", lastUpdated: "2025-02-19T06:00:00Z" },
    ],
  },
  {
    id: "ref-002",
    name: "Port Harcourt Refinery (PHRC)",
    location: "Alesa-Eleme, Rivers State",
    status: "active",
    capacity: "210,000 bpd",
    logo: "/images/refineries/nnpc.png",
    description: "Nigeria's second-largest refinery complex, recently rehabilitated.",
    products: [
      { type: "AGO", price: 1125, previousPrice: 1120, availability: "available", lastUpdated: "2025-02-19T05:00:00Z" },
      { type: "PMS", price: 865, previousPrice: 860, availability: "limited", lastUpdated: "2025-02-19T05:00:00Z" },
    ],
  },
  {
    id: "ref-003",
    name: "Warri Refinery (WRPC)",
    location: "Warri, Delta State",
    status: "limited",
    capacity: "125,000 bpd",
    logo: "/images/refineries/nnpc.png",
    description: "Currently operating at limited capacity, undergoing maintenance.",
    products: [
      { type: "AGO", price: 1130, previousPrice: 1128, availability: "limited", lastUpdated: "2025-02-18T14:00:00Z" },
    ],
  },
  {
    id: "ref-004",
    name: "Kaduna Refinery (KRPC)",
    location: "Kaduna State",
    status: "inactive",
    capacity: "110,000 bpd",
    logo: "/images/refineries/nnpc.png",
    description: "Currently offline for comprehensive rehabilitation works.",
    products: [],
  },
  {
    id: "ref-005",
    name: "BUA Refinery",
    location: "Akwa Ibom State",
    status: "coming-soon",
    capacity: "200,000 bpd",
    logo: "/images/refineries/bua.png",
    description: "Under construction, expected to commence operations in Q4 2025.",
    products: [],
    expectedLaunch: "Q4 2025",
  },
  {
    id: "ref-006",
    name: "Waltersmith Refinery",
    location: "Ibigwe, Imo State",
    status: "active",
    capacity: "5,000 bpd",
    logo: "/images/refineries/waltersmith.png",
    description: "Nigeria's first modular refinery, focusing on diesel production.",
    products: [
      { type: "AGO", price: 1135, previousPrice: 1130, availability: "limited", lastUpdated: "2025-02-19T04:00:00Z" },
    ],
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "active":
      return { label: "Active", color: "success", icon: CheckCircle2 };
    case "limited":
      return { label: "Limited Ops", color: "warning", icon: AlertCircle };
    case "inactive":
      return { label: "Offline", color: "danger", icon: XCircle };
    case "coming-soon":
      return { label: "Coming Soon", color: "primary", icon: Calendar };
    default:
      return { label: "Unknown", color: "default", icon: AlertCircle };
  }
};

const getAvailabilityColor = (availability: string) => {
  switch (availability) {
    case "available":
      return "text-success-600 bg-success-100";
    case "limited":
      return "text-warning-600 bg-warning-100";
    case "unavailable":
      return "text-danger-600 bg-danger-100";
    default:
      return "text-slate-600 bg-slate-100";
  }
};

export default function RefineriesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRefineries = refineries.filter((refinery) =>
    statusFilter === "all" || refinery.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Refinery Prices</h1>
          <p className="text-slate-500">Ex-works prices from Nigerian refineries</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          Prices updated by admin • Last update: Today, 6:00 AM
        </div>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary-50 border border-primary-100 rounded-2xl p-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-900">About Refinery Prices</h3>
            <p className="text-sm text-primary-700">
              These are ex-works (factory gate) prices. Depot prices include transportation, 
              storage, and handling costs. Always compare with depot prices for your actual purchase cost.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Status Filters */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "All Refineries" },
          { id: "active", label: "Active" },
          { id: "limited", label: "Limited" },
          { id: "inactive", label: "Offline" },
          { id: "coming-soon", label: "Coming Soon" },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              statusFilter === filter.id
                ? "bg-primary-500 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Refinery Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {filteredRefineries.map((refinery, index) => {
          const statusConfig = getStatusConfig(refinery.status);
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={refinery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "bg-white rounded-2xl shadow-sm border overflow-hidden",
                refinery.status === "inactive" && "opacity-75"
              )}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Factory className="w-7 h-7 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{refinery.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <MapPin className="w-4 h-4" />
                        {refinery.location}
                      </div>
                    </div>
                  </div>
                  <Badge variant={statusConfig.color as "warning" | "primary" | "secondary" | "success" | "danger"} className="gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </Badge>
                </div>

                <p className="text-sm text-slate-600 mt-4">{refinery.description}</p>

                <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                  <span>Capacity: <strong className="text-slate-700">{refinery.capacity}</strong></span>
                  {refinery.expectedLaunch && (
                    <span>Launch: <strong className="text-slate-700">{refinery.expectedLaunch}</strong></span>
                  )}
                </div>
              </div>

              {/* Products */}
              {refinery.products.length > 0 ? (
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">Current Prices (Ex-Works)</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {refinery.products.map((product) => {
                      const priceChange = product.price - product.previousPrice;
                      return (
                        <div
                          key={product.type}
                          className="p-4 rounded-xl bg-slate-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="primary">{product.type}</Badge>
                            <Badge size="sm" className={getAvailabilityColor(product.availability)}>
                              {product.availability}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-slate-900">
                            ₦{formatNumber(product.price)}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                           {priceChange !== 0 && (
                              <span className={cn(
                                "flex items-center gap-1 text-xs font-medium",
                                priceChange > 0 ? "text-success-600" : "text-danger-600"
                              )}>
                                {priceChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {priceChange > 0 ? "+" : ""}₦{priceChange}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              {formatRelativeTime(product.lastUpdated)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <Factory className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No products available</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}