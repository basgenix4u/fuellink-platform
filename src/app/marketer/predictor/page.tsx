// src/app/marketer/predictor/page.tsx
// AI Price Predictor — powered by Claude API via Anthropic
// Scans oil & gas news, refinery updates, FX rates to predict today's prices
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Bot,
  RefreshCw,
  Info,
  Globe,
  Newspaper,
  BarChart3,
  Zap,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { cn, formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PricePrediction {
  product: string;
  productLabel: string;
  currentAvgPrice: number;
  predictedMin: number;
  predictedMax: number;
  trend: "up" | "down" | "stable";
  confidence: number;
  factors: { title: string; impact: "positive" | "negative" | "neutral"; detail: string }[];
}

interface NewsItem {
  headline: string;
  source: string;
  impact: "positive" | "negative" | "neutral";
  timestamp: string;
}

// ─── Mock data (real app calls Claude API with web search) ───────────────────

const MOCK_PREDICTIONS: PricePrediction[] = [
  {
    product: "PMS",
    productLabel: "PMS (Petrol)",
    currentAvgPrice: 897,
    predictedMin: 893,
    predictedMax: 912,
    trend: "up",
    confidence: 87,
    factors: [
      { title: "Dangote refinery output stable", impact: "neutral", detail: "Production at ~400k bpd — no shortage expected" },
      { title: "USD/NGN rate weakened slightly", impact: "negative", detail: "FX at ₦1,620/USD may push import costs slightly higher" },
      { title: "Global crude price uptick", impact: "negative", detail: "Brent crude at $82/bbl, up 1.3% from yesterday" },
    ],
  },
  {
    product: "AGO",
    productLabel: "AGO (Diesel)",
    currentAvgPrice: 1150,
    predictedMin: 1140,
    predictedMax: 1168,
    trend: "stable",
    confidence: 91,
    factors: [
      { title: "Dangote diesel output high", impact: "positive", detail: "Ample supply reduces import dependency" },
      { title: "Rainy season reduces demand", impact: "positive", detail: "Generator usage drops slightly — less pressure on price" },
      { title: "NNPCL depot prices unchanged", impact: "neutral", detail: "No bulletin issued today" },
    ],
  },
  {
    product: "DPK",
    productLabel: "DPK (Kerosene)",
    currentAvgPrice: 980,
    predictedMin: 975,
    predictedMax: 995,
    trend: "stable",
    confidence: 84,
    factors: [
      { title: "Steady refinery supply", impact: "positive", detail: "PHC old refinery contributing 22k bpd of DPK" },
      { title: "Rural demand pickup", impact: "negative", detail: "School term resumption increasing cooking fuel demand" },
    ],
  },
  {
    product: "LPG",
    productLabel: "LPG (Cooking Gas)",
    currentAvgPrice: 1050,
    predictedMin: 1040,
    predictedMax: 1065,
    trend: "up",
    confidence: 79,
    factors: [
      { title: "International LPG price rising", impact: "negative", detail: "Mont Belvieu LPG price up 2.1% this week" },
      { title: "Dangote LPG exports stabilizing local supply", impact: "positive", detail: "Domestic supply buffer remains adequate" },
    ],
  },
];

const MOCK_NEWS: NewsItem[] = [
  { headline: "Dangote refinery hits 450,000 bpd production milestone", source: "Nairametrics", impact: "positive", timestamp: new Date(Date.now() - 1800000).toISOString() },
  { headline: "NNPCL issues no price update for April — market stable", source: "Punch", impact: "neutral", timestamp: new Date(Date.now() - 3600000).toISOString() },
  { headline: "Brent crude rises 1.3% on Middle East supply concerns", source: "Reuters", impact: "negative", timestamp: new Date(Date.now() - 5400000).toISOString() },
  { headline: "CBN FX intervention stabilizes naira at ₦1,620/$", source: "BusinessDay", impact: "positive", timestamp: new Date(Date.now() - 7200000).toISOString() },
  { headline: "Crude oil demand projections revised upward by IEA for Q2", source: "Bloomberg", impact: "negative", timestamp: new Date(Date.now() - 9000000).toISOString() },
];

// ─── Components ───────────────────────────────────────────────────────────────

function TrendIcon({ trend, size = "sm" }: { trend: "up" | "down" | "stable"; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  if (trend === "up") return <TrendingUp className={cn(cls, "text-red-500")} />;
  if (trend === "down") return <TrendingDown className={cn(cls, "text-green-500")} />;
  return <Minus className={cn(cls, "text-slate-400")} />;
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            value >= 85 ? "bg-green-500" : value >= 70 ? "bg-amber-500" : "bg-red-400"
          )}
        />
      </div>
      <span className="text-xs font-bold text-slate-600 w-10 text-right">{value}%</span>
    </div>
  );
}

function PredictionCard({ pred }: { pred: PricePrediction }) {
  const [expanded, setExpanded] = useState(false);
  const priceSpread = pred.predictedMax - pred.predictedMin;
  const midPrice = Math.round((pred.predictedMin + pred.predictedMax) / 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{pred.product}</span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                pred.trend === "up" ? "bg-red-100 text-red-600" : pred.trend === "down" ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
              )}>
                {pred.trend === "up" ? "↑ Rising" : pred.trend === "down" ? "↓ Falling" : "→ Stable"}
              </span>
            </div>
            <p className="text-sm text-slate-600">{pred.productLabel}</p>
          </div>
          <TrendIcon trend={pred.trend} size="lg" />
        </div>

        {/* Price range visual */}
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Predicted range today</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(pred.predictedMin)} – {formatCurrency(pred.predictedMax)}
                <span className="text-sm font-normal text-slate-400 ml-1">/L</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Current avg.</p>
              <p className="text-sm font-semibold text-slate-600">{formatCurrency(pred.currentAvgPrice)}/L</p>
            </div>
          </div>

          {/* Range bar */}
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ left: "15%" }}
              className={cn(
                "absolute h-full rounded-full",
                pred.trend === "up" ? "bg-gradient-to-r from-amber-400 to-red-400" :
                pred.trend === "down" ? "bg-gradient-to-r from-green-400 to-emerald-500" :
                "bg-gradient-to-r from-primary-400 to-primary-500"
              )}
            />
            {/* Current price marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-700"
              style={{ left: `${((pred.currentAvgPrice - pred.predictedMin) / priceSpread) * 70 + 15}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{formatCurrency(pred.predictedMin)}</span>
            <span>▲ Current: {formatCurrency(pred.currentAvgPrice)}</span>
            <span>{formatCurrency(pred.predictedMax)}</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">AI Confidence</span>
          </div>
          <ConfidenceBar value={pred.confidence} />
        </div>

        {/* Expand factors */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          {expanded ? "Hide" : "Show"} price factors ({pred.factors.length})
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 pt-3 border-t border-slate-100">
                {pred.factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      f.impact === "positive" ? "bg-green-100" : f.impact === "negative" ? "bg-red-100" : "bg-slate-100"
                    )}>
                      {f.impact === "positive" ? (
                        <ArrowDown className="w-3 h-3 text-green-600" />
                      ) : f.impact === "negative" ? (
                        <ArrowUp className="w-3 h-3 text-red-500" />
                      ) : (
                        <Minus className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{f.title}</p>
                      <p className="text-[11px] text-slate-500">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PricePredictorPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleAskAI = async () => {
    if (!aiQuery.trim()) return;
    setIsQuerying(true);
    setAiResponse("");

    // In real app: call Claude API with web_search tool
    await new Promise((r) => setTimeout(r, 2200));
    setAiResponse(
      `Based on current market data:\n\n• Dangote refinery is producing at 68% capacity today (~440k bpd), with PMS output prioritized\n• Global Brent crude is at $82/bbl — a slight headwind for prices\n• No NNPCL price bulletin has been issued this week, suggesting stability\n• The naira is relatively stable at ₦1,618/$, limiting import cost pressure\n\n**My assessment:** PMS prices are likely to stay between ₦897–₦912 over the next 48 hours unless a major NNPCL announcement is made. Best time to buy is early morning when depots are freshly stocked.`
    );
    setIsQuerying(false);
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" className="inline-flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              AI-Powered
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Price Predictor</h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
            <Clock className="w-3.5 h-3.5" />
            Last updated: {lastUpdated.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
            {" "}· Updates every 60 minutes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />}
          onClick={handleRefresh}
          isLoading={isRefreshing}
          loadingText="Refreshing..."
        >
          Refresh
        </Button>
      </div>

      {/* Data sources banner */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
        <Globe className="w-4 h-4 text-primary-500 flex-shrink-0" />
        <p className="text-xs text-primary-700">
          AI monitors: <strong>Dangote & NNPCL bulletins</strong> • <strong>Brent/WTI crude prices</strong> •
          <strong> CBN FX rates</strong> • <strong>Nigeria oil & gas news</strong> — updated every 60 minutes
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Predictions grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Today's Price Predictions</h2>
          {MOCK_PREDICTIONS.map((pred) => (
            <PredictionCard key={pred.product} pred={pred} />
          ))}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Ask the AI */}
          <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-5 h-5 text-secondary-400" />
              <h3 className="font-bold">Ask the AI</h3>
            </div>
            <p className="text-xs text-white/70 mb-3">
              Ask anything about today's market conditions, pricing outlook, or what's moving prices.
            </p>
            <textarea
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="e.g. Should I buy AGO today or wait until tomorrow?"
              rows={3}
              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-secondary-400 transition-all resize-none mb-3"
            />
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={handleAskAI}
              isLoading={isQuerying}
              loadingText="Analyzing..."
            >
              Ask AI
            </Button>

            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-white/10 rounded-xl p-3"
              >
                <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
                  {aiResponse.replace(/\*\*(.*?)\*\*/g, '$1')}
                </p>
              </motion.div>
            )}
          </div>

          {/* Recent news */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Market News</h3>
              <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                Live
              </span>
            </div>
            <div className="space-y-3">
              {MOCK_NEWS.map((news, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5",
                    news.impact === "positive" ? "bg-green-500" :
                    news.impact === "negative" ? "bg-red-500" : "bg-slate-400"
                  )} />
                  <div>
                    <p className="text-xs text-slate-800 leading-relaxed">{news.headline}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {news.source} · {new Date(news.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Predictions are AI estimates based on available data. Always confirm prices with depots before placing large orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
