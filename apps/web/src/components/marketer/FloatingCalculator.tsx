// src/components/marketer/FloatingCalculator.tsx

"use client";

import { useState, useRef } from "react";
import { motion, useDragControls, PanInfo } from "framer-motion";
import {
  Calculator,
  X,
  Minimize2,
  Maximize2,
  GripHorizontal,
  TrendingUp,
  Fuel,
  Truck,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

interface FloatingCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingCalculator({ isOpen, onClose }: FloatingCalculatorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  const [values, setValues] = useState({
    depotPrice: 1150,
    pumpPrice: 1250,
    quantity: 33000,
    transportCost: 150000,
    otherCosts: 50000,
  });

  const totalCost = (values.depotPrice * values.quantity) + values.transportCost + values.otherCosts;
  const totalRevenue = values.pumpPrice * values.quantity;
  const profit = totalRevenue - totalCost;
  const profitMargin = ((profit / totalRevenue) * 100).toFixed(1);
  const profitPerLitre = profit / values.quantity;

  if (!isOpen) return null;

  return (
    <>
      {/* Drag Constraints Container */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-50" />

      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        dragElastic={0}
        initial={{ opacity: 0, scale: 0.9, x: 100, y: 100 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          height: isMinimized ? "auto" : "auto",
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto",
          isMinimized ? "w-72" : "w-96"
        )}
        style={{
          right: 24,
          bottom: 100,
        }}
      >
        {/* Header - Draggable */}
        <div
          className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white p-4 cursor-move"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Profit Calculator</h3>
                {!isMinimized && (
                  <p className="text-xs text-white/70">Drag to move</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Input Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Depot Price (₦/Litre)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={values.depotPrice}
                    onChange={(e) => setValues({ ...values, depotPrice: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Your Pump Price (₦/Litre)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={values.pumpPrice}
                    onChange={(e) => setValues({ ...values, pumpPrice: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Quantity (Litres)
                </label>
                <div className="relative">
                  <Fuel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={values.quantity}
                    onChange={(e) => setValues({ ...values, quantity: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Transport Cost (₦)
                </label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={values.transportCost}
                    onChange={(e) => setValues({ ...values, transportCost: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Other Costs (₦)
                </label>
                <input
                  type="number"
                  value={values.otherCosts}
                  onChange={(e) => setValues({ ...values, otherCosts: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                />
              </div>
            </div>

            {/* Results */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Cost</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Revenue</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Profit/Litre</span>
                <span className={cn(
                  "font-semibold",
                  profitPerLitre >= 0 ? "text-success-600" : "text-danger-600"
                )}>
                  ₦{profitPerLitre.toFixed(2)}
                </span>
              </div>
              
              {/* Profit Highlight */}
              <div className={cn(
                "p-4 rounded-xl",
                profit >= 0 ? "bg-success-50" : "bg-danger-50"
              )}>
                <p className="text-xs text-slate-500 mb-1">Expected Profit</p>
                <div className="flex items-baseline justify-between">
                  <span className={cn(
                    "text-2xl font-bold",
                    profit >= 0 ? "text-success-600" : "text-danger-600"
                  )}>
                    {formatCurrency(Math.abs(profit))}
                  </span>
                  <span className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    profit >= 0 ? "text-success-600" : "text-danger-600"
                  )}>
                    <TrendingUp className="w-4 h-4" />
                    {profitMargin}% margin
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2">
              <p className="text-xs text-slate-500 mb-2">Quick Volume Presets</p>
              <div className="flex gap-2">
                {[33000, 45000, 66000].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setValues({ ...values, quantity: qty })}
                    className={cn(
                      "flex-1 py-2 text-xs font-medium rounded-lg transition-colors",
                      values.quantity === qty
                        ? "bg-secondary-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {formatNumber(qty)}L
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="p-3">
            <div className={cn(
              "flex items-center justify-between p-2 rounded-lg",
              profit >= 0 ? "bg-success-50" : "bg-danger-50"
            )}>
              <span className="text-xs text-slate-500">Profit:</span>
              <span className={cn(
                "font-bold",
                profit >= 0 ? "text-success-600" : "text-danger-600"
              )}>
                {formatCurrency(profit)}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}