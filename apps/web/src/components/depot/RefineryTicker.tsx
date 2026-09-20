// src/components/depot/RefineryTicker.tsx

"use client";

import { motion } from "framer-motion";
import { Factory } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const refineryPrices = [
  { name: "Dangote", product: "AGO", price: 1120 },
  { name: "Dangote", product: "PMS", price: 860 },
  { name: "Dangote", product: "DPK", price: 1050 },
  { name: "PHRC", product: "AGO", price: 1125 },
  { name: "PHRC", product: "PMS", price: 865 },
  { name: "Warri", product: "AGO", price: 1130 },
];

export default function RefineryTicker() {
  // Triple duplication for smoother infinite scrolling
  const duplicated = [...refineryPrices, ...refineryPrices, ...refineryPrices];

  return (
    <div className="bg-slate-900 text-white overflow-hidden border-b border-slate-700 h-10 flex relative z-20">
      {/* Static Label */}
      <div className="flex items-center gap-2 px-4 bg-slate-800 z-30 shadow-lg">
        <Factory className="w-3 h-3 text-secondary-400" />
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider whitespace-nowrap">
          Refinery Prices
        </span>
      </div>
      
      {/* Moving Ticker */}
      <div className="flex-1 flex items-center overflow-hidden">
        <motion.div
          className="flex items-center gap-8 whitespace-nowrap pl-4"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {duplicated.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">{item.name}</span>
              <span className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] font-bold text-secondary-400">
                {item.product}
              </span>
              <span className="font-bold text-white">₦{formatNumber(item.price)}</span>
              <span className="text-slate-700">|</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
