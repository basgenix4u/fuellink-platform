// src/app/depot/inventory/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  AlertTriangle,
  TrendingDown,
  Droplets,
  Settings,
  RefreshCcw,
  Edit,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatNumber } from "@/lib/utils";

interface Tank {
  id: string;
  name: string;
  product: string;
  productName: string;
  capacity: number;
  currentLevel: number;
  minLevel: number;
  lastRefill: string;
  status: "normal" | "warning" | "critical";
}

const tanks: Tank[] = [
  {
    id: "tank-1",
    name: "Tank A1",
    product: "AGO",
    productName: "Diesel",
    capacity: 5000000,
    currentLevel: 3500000,
    minLevel: 500000,
    lastRefill: "2025-02-15",
    status: "normal",
  },
  {
    id: "tank-2",
    name: "Tank A2",
    product: "AGO",
    productName: "Diesel",
    capacity: 3000000,
    currentLevel: 2200000,
    minLevel: 300000,
    lastRefill: "2025-02-17",
    status: "normal",
  },
  {
    id: "tank-3",
    name: "Tank B1",
    product: "PMS",
    productName: "Petrol",
    capacity: 4000000,
    currentLevel: 2800000,
    minLevel: 400000,
    lastRefill: "2025-02-16",
    status: "normal",
  },
  {
    id: "tank-4",
    name: "Tank B2",
    product: "PMS",
    productName: "Petrol",
    capacity: 2500000,
    currentLevel: 600000,
    minLevel: 250000,
    lastRefill: "2025-02-10",
    status: "warning",
  },
  {
    id: "tank-5",
    name: "Tank C1",
    product: "DPK",
    productName: "Kerosene",
    capacity: 1500000,
    currentLevel: 800000,
    minLevel: 150000,
    lastRefill: "2025-02-14",
    status: "normal",
  },
  {
    id: "tank-6",
    name: "Tank D1",
    product: "LPG",
    productName: "Cooking Gas",
    capacity: 1000000,
    currentLevel: 150000,
    minLevel: 100000,
    lastRefill: "2025-02-01",
    status: "critical",
  },
];

function TankVisualization({ tank }: { tank: Tank }) {
  const fillPercentage = (tank.currentLevel / tank.capacity) * 100;
  const minPercentage = (tank.minLevel / tank.capacity) * 100;

  const getStatusColor = () => {
    if (tank.status === "critical") return "from-danger-500 to-danger-600";
    if (tank.status === "warning") return "from-warning-500 to-warning-600";
    return "from-primary-500 to-primary-600";
  };

  const getStatusBg = () => {
    if (tank.status === "critical") return "bg-danger-100";
    if (tank.status === "warning") return "bg-warning-100";
    return "bg-primary-100";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow",
        tank.status === "critical"
          ? "border-danger-200"
          : tank.status === "warning"
          ? "border-warning-200"
          : "border-slate-100"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{tank.name}</h3>
            {tank.status !== "normal" && (
              <AlertTriangle
                className={cn(
                  "w-4 h-4",
                  tank.status === "critical"
                    ? "text-danger-500"
                    : "text-warning-500"
                )}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                tank.product === "AGO"
                  ? "primary"
                  : tank.product === "PMS"
                  ? "secondary"
                  : "default"
              }
            >
              {tank.product}
            </Badge>
            <span className="text-sm text-slate-500">{tank.productName}</span>
          </div>
        </div>
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <Edit className="w-4 h-4" />
        </button>
      </div>

      {/* Tank Visualization */}
      <div className="relative mb-6">
        {/* Tank Container */}
        <div className="relative h-40 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200">
          {/* Minimum Level Indicator */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-danger-400 z-10"
            style={{ bottom: `${minPercentage}%` }}
          >
            <span className="absolute -top-3 right-2 text-xs text-danger-500 bg-white px-1">
              Min
            </span>
          </div>

          {/* Fill Level */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${fillPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t",
              getStatusColor()
            )}
          >
            {/* Wave Animation */}
            <div className="absolute inset-x-0 top-0 h-4 overflow-hidden">
              <div className="wave-animation" />
            </div>
          </motion.div>

          {/* Percentage Label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
              <span className="text-2xl font-bold text-slate-900">
                {fillPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Capacity Markers */}
        <div className="absolute -right-8 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-400">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={cn("rounded-xl p-3", getStatusBg())}>
          <p className="text-xs text-slate-500 mb-1">Current Level</p>
          <p className="font-bold text-slate-900">
            {formatNumber(tank.currentLevel)}L
          </p>
        </div>
        <div className="rounded-xl p-3 bg-slate-50">
          <p className="text-xs text-slate-500 mb-1">Capacity</p>
          <p className="font-bold text-slate-900">
            {formatNumber(tank.capacity)}L
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="text-sm text-slate-500">
          Last refill: {tank.lastRefill}
        </div>
        <Badge
          variant={
            tank.status === "critical"
              ? "danger"
              : tank.status === "warning"
              ? "warning"
              : "success"
          }
        >
          {tank.status === "critical"
            ? "Critical"
            : tank.status === "warning"
            ? "Low Stock"
            : "Normal"}
        </Badge>
      </div>
    </motion.div>
  );
}

export default function InventoryPage() {
  const [filterProduct, setFilterProduct] = useState<string>("all");

  const filteredTanks =
    filterProduct === "all"
      ? tanks
      : tanks.filter((t) => t.product === filterProduct);

  const totalCapacity = tanks.reduce((sum, t) => sum + t.capacity, 0);
  const totalCurrent = tanks.reduce((sum, t) => sum + t.currentLevel, 0);
  const overallPercentage = (totalCurrent / totalCapacity) * 100;

  const criticalTanks = tanks.filter((t) => t.status === "critical").length;
  const warningTanks = tanks.filter((t) => t.status === "warning").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventory Management
          </h1>
          <p className="text-slate-500">
            Monitor tank levels and manage your stock in real-time.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Sync Levels
          </Button>
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            Add Tank
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Stock</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatNumber(totalCurrent)}L
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-50 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-secondary-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Fill Rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {overallPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-slate-900">
                {warningTanks}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-danger-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Critical</p>
              <p className="text-2xl font-bold text-slate-900">
                {criticalTanks}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Alerts */}
      {(criticalTanks > 0 || warningTanks > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger-50 border border-danger-100 rounded-2xl p-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <h3 className="font-semibold text-danger-900">
                Stock Alert: Action Required
              </h3>
              <p className="text-sm text-danger-700 mt-1">
                {criticalTanks > 0 &&
                  `${criticalTanks} tank${criticalTanks > 1 ? "s" : ""} at critical level. `}
                {warningTanks > 0 &&
                  `${warningTanks} tank${warningTanks > 1 ? "s" : ""} running low. `}
                Consider scheduling a refill soon.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700">
          Filter by Product:
        </span>
        <div className="flex gap-2">
          {["all", "AGO", "PMS", "DPK", "LPG"].map((product) => (
            <button
              key={product}
              onClick={() => setFilterProduct(product)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                filterProduct === product
                  ? "bg-primary-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {product === "all" ? "All Products" : product}
            </button>
          ))}
        </div>
      </div>

      {/* Tanks Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTanks.map((tank) => (
          <TankVisualization key={tank.id} tank={tank} />
        ))}
      </div>

      {/* Add CSS for wave animation */}
      <style jsx global>{`
        @keyframes wave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .wave-animation {
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: wave 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}