"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";
import { getMarketAveragePrice, productTypeLabels, mockDepots } from "@/lib/mock-data";
import type { ProductType } from "@/types";

interface FloatingPriceAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRODUCTS = Object.keys(productTypeLabels) as ProductType[];

export function FloatingPriceAlert({ isOpen, onClose }: FloatingPriceAlertProps) {
  const [product, setProduct] = useState<ProductType>("PMS");
  const [condition, setCondition] = useState<"below" | "above">("below");
  const [targetPrice, setTargetPrice] = useState("");
  const [depotFilter, setDepotFilter] = useState<"all" | string>("all");

  const marketPrice = getMarketAveragePrice(product);
  const target = Number(targetPrice);
  const valid = targetPrice !== "" && target > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Enter a valid target price");
      return;
    }
    toast.success(
      `Alert created: ${product} ${condition === "below" ? "≤" : "≥"} ₦${formatNumber(target)}`
    );
    setTargetPrice("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Create Price Alert</h2>
                  <p className="text-xs text-slate-500">
                    We&apos;ll notify you when the market hits your target
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Product
                </label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value as ProductType)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>
                      {productTypeLabels[p]}
                    </option>
                  ))}
                </select>
                {marketPrice !== null && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    Current market average:{" "}
                    <span className="font-medium text-slate-700">
                      ₦{formatNumber(marketPrice)}
                    </span>
                  </p>
                )}
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Alert when price is
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "below", label: "Below target", icon: TrendingDown },
                      { id: "above", label: "Above target", icon: TrendingUp },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCondition(opt.id)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        condition === opt.id
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target price (₦/litre)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder={marketPrice !== null ? String(marketPrice) : "e.g. 1100"}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Depot filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Watch
                </label>
                <select
                  value={depotFilter}
                  onChange={(e) => setDepotFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All depots &amp; refineries</option>
                  {mockDepots.map((depot) => (
                    <option key={depot.id} value={depot.name}>
                      {depot.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={!valid}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Create Alert
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
