// src/app/depot/private-prices/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  Save,
  Info,
  CheckCircle2,
  Bot,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import toast from "react-hot-toast";

const products = [
  { id: "PMS", label: "PMS (Petrol)", unit: "₦/litre", refPrice: 897, color: "bg-green-100 text-green-700" },
  { id: "AGO", label: "AGO (Diesel)", unit: "₦/litre", refPrice: 1150, color: "bg-amber-100 text-amber-700" },
  { id: "DPK", label: "DPK (Kerosene)", unit: "₦/litre", refPrice: 980, color: "bg-blue-100 text-blue-700" },
  { id: "LPG", label: "LPG (Cooking Gas)", unit: "₦/kg", refPrice: 1050, color: "bg-purple-100 text-purple-700" },
  { id: "JET_A1", label: "JET A-1 (Aviation)", unit: "₦/litre", refPrice: 1320, color: "bg-slate-100 text-slate-700" },
];

export default function PrivatePricesPage() {
  const [prices, setPrices] = useState<Record<string, string>>({
    PMS: "905",
    AGO: "1155",
    DPK: "990",
    LPG: "1060",
    JET_A1: "",
  });
  const [showPrices, setShowPrices] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSaving(false);
    toast.success("Private prices updated. Your AI chatbot now knows these prices.");
  };

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Private Price Settings</h1>
            <p className="text-sm text-slate-500">Only your AI chatbot knows these prices — not shown publicly</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-1">How private pricing works</p>
          <p className="text-sm text-blue-700">
            Your prices are <strong>never shown on the public depot listing</strong>.
            When a marketer chats with your AI and asks for price, the AI shares this price
            as a starting point for negotiation. This drives more chat conversations and keeps
            your pricing competitive without public exposure.
          </p>
        </div>
      </div>

      {/* Price table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Your Depot Prices</h2>
          <button
            onClick={() => setShowPrices(!showPrices)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            {showPrices ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPrices ? "Hide" : "Show"}
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {products.map((product) => {
            const val = prices[product.id];
            const numVal = Number(val);
            const refPrice = product.refPrice;
            const diff = numVal && refPrice ? ((numVal - refPrice) / refPrice * 100).toFixed(1) : null;

            return (
              <div key={product.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-28">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${product.color}`}>
                    {product.id}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{product.unit}</p>
                </div>

                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">{product.label}</p>
                  <div className="relative max-w-[180px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
                    <input
                      type={showPrices ? "number" : "password"}
                      value={val}
                      onChange={(e) => setPrices({ ...prices, [product.id]: e.target.value })}
                      placeholder="Set price..."
                      className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                  </div>
                </div>

                <div className="text-right w-32">
                  <p className="text-xs text-slate-400 mb-0.5">Dangote ref.</p>
                  <p className="text-sm font-semibold text-slate-600">₦{refPrice.toLocaleString()}</p>
                  {diff && numVal > 0 && (
                    <p className={`text-xs font-medium ${Number(diff) > 0 ? "text-red-500" : "text-green-500"}`}>
                      {Number(diff) > 0 ? "+" : ""}{diff}%
                    </p>
                  )}
                </div>

                <div className="w-6">
                  {val && Number(val) > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={isSaving}
            loadingText="Saving..."
            onClick={handleSave}
          >
            Save Private Prices
          </Button>
        </div>
      </div>

      {/* AI chatbot note */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-5 text-white flex gap-4">
        <Bot className="w-7 h-7 text-secondary-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">Your AI chatbot uses these prices</p>
          <p className="text-sm text-white/75 leading-relaxed">
            Whenever a marketer asks your AI &quot;How much is PMS?&quot;, the AI will share your
            set price and invite them to negotiate or place an order. This drives real
            conversations that lead to real deals — without exposing your pricing publicly.
          </p>
          <div className="mt-3">
            <a href="/depot/ai-settings" className="text-secondary-300 text-sm font-semibold hover:text-secondary-200 transition-colors">
              Configure your AI chatbot →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}