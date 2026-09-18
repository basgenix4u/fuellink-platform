// src/app/marketer/alerts/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";
import { FloatingPriceAlert } from "@/components/marketer/FloatingPriceAlert";

interface PriceAlert {
  id: string;
  product: string;
  targetPrice: number;
  currentPrice: number;
  condition: "below" | "above";
  status: "active" | "triggered" | "inactive";
  lastTriggered?: string;
  depotFilter: "all" | "specific";
  specificDepot?: string;
}

const initialAlerts: PriceAlert[] = [
  {
    id: "alert-1",
    product: "AGO",
    targetPrice: 1100,
    currentPrice: 1150,
    condition: "below",
    status: "active",
    depotFilter: "all",
  },
  {
    id: "alert-2",
    product: "PMS",
    targetPrice: 850,
    currentPrice: 890,
    condition: "below",
    status: "active",
    depotFilter: "specific",
    specificDepot: "Dangote Refinery",
  },
  {
    id: "alert-3",
    product: "DPK",
    targetPrice: 1000,
    currentPrice: 950,
    condition: "below",
    status: "triggered",
    lastTriggered: "2025-02-18T10:30:00Z",
    depotFilter: "all",
  },
];

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(initialAlerts);
  const [showFloatingAlert, setShowFloatingAlert] = useState(false);

  const handleDelete = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
    toast.success("Alert deleted");
  };

  const handleToggleStatus = (id: string) => {
    setAlerts(
      alerts.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "active" ? "inactive" : "active" }
          : a
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Price Alerts</h1>
          <p className="text-slate-500">Get notified when prices match your targets</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowFloatingAlert(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Alerts List */}
      <div className="grid gap-4">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "bg-white rounded-2xl p-6 border transition-all",
              alert.status === "triggered"
                ? "border-success-200 shadow-sm"
                : "border-slate-100 shadow-sm hover:shadow-md"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    alert.status === "triggered"
                      ? "bg-success-100 text-success-600"
                      : "bg-primary-50 text-primary-500"
                  )}
                >
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">
                      {alert.product} {alert.condition === "below" ? "≤" : "≥"} ₦
                      {formatNumber(alert.targetPrice)}
                    </h3>
                    {alert.status === "triggered" && (
                      <Badge variant="success">Triggered</Badge>
                    )}
                    {alert.status === "inactive" && (
                      <Badge variant="default">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    Current market price:{" "}
                    <span className="font-medium text-slate-900">
                      ₦{formatNumber(alert.currentPrice)}
                    </span>
                  </p>
                  {alert.depotFilter === "specific" && (
                    <p className="text-xs text-slate-400 mt-1">
                      Watching: {alert.specificDepot}
                    </p>
                  )}
                  {alert.lastTriggered && (
                    <p className="text-xs text-success-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Matched {formatRelativeTime(alert.lastTriggered)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleStatus(alert.id)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    alert.status === "active"
                      ? "text-primary-600 hover:bg-primary-50"
                      : "text-slate-400 hover:bg-slate-50"
                  )}
                  title={alert.status === "active" ? "Deactivate" : "Activate"}
                >
                  {alert.status === "active" ? (
                    <Bell className="w-5 h-5 fill-current" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-danger-500 hover:bg-danger-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No alerts set</h3>
            <p className="text-slate-500 mb-6">
              Create an alert to get notified when prices change
            </p>
            <Button variant="primary" size="md" onClick={() => setShowFloatingAlert(true)}>
              Create First Alert
            </Button>
          </div>
        )}
      </div>

      <FloatingPriceAlert 
        isOpen={showFloatingAlert} 
        onClose={() => setShowFloatingAlert(false)} 
      />
    </div>
  );
}