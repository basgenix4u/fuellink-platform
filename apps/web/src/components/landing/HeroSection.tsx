// src/components/landing/HeroSection.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
  Fuel,
  BarChart3,
  Mic,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { formatCompactNumber } from "@/lib/utils";
import Link from "next/link";

// Animated counter
function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}
      {suffix}
    </span>
  );
}

// AI Chat preview widget
function AIChatPreview() {
  const messages = [
    { role: "marketer", text: "Suna da PMS? Nawa ne farashi?" , lang: "ha" },
    { role: "ai", text: "Yes! Dangote depot has PMS available. Current price range: ₦897–₦915/L. Want to place an order or speak to the depot?" },
    { role: "marketer", text: "Yes, 33,000 litres please." },
    { role: "ai", text: "Order initiated. Connecting you to depot manager for final confirmation. Payment via Providus transfer." },
  ];

  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCount((c) => (c < messages.length ? c + 1 : 0));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-500 to-primary-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">FuelLink AI</p>
          <p className="text-slate-400 text-xs">Depot Assistant • Online</p>
        </div>
        <div className="ml-auto flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 min-h-[200px]">
        {messages.slice(0, visibleCount + 1).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "ai"
                  ? "bg-slate-700 text-slate-100 rounded-tl-sm"
                  : "bg-secondary-500 text-white rounded-tr-sm"
              }`}
            >
              {msg.lang && (
                <span className="text-[10px] opacity-60 block mb-0.5">
                  🎙 Voice note ({msg.lang === "ha" ? "Hausa" : "EN"}) → transcribed
                </span>
              )}
              {msg.text}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input bar */}
      <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
        <div className="flex-1 bg-slate-700 rounded-full px-3 py-1.5 text-xs text-slate-400">
          Type or record voice note...
        </div>
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <Mic className="w-3.5 h-3.5 text-red-400" />
        </div>
      </div>
    </div>
  );
}

// Price predictor preview
function PricePredictorPreview() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary-600" />
        <span className="text-xs font-bold text-slate-700">AI Price Prediction — Today</span>
        <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Live</span>
      </div>
      {[
        { product: "PMS", range: "₦893–₦910", trend: "up", confidence: 87 },
        { product: "AGO", range: "₦1,140–₦1,165", trend: "stable", confidence: 91 },
        { product: "LPG", range: "₦1,040–₦1,060", trend: "up", confidence: 79 },
      ].map((item) => (
        <div key={item.product} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
          <span className="text-xs font-bold text-slate-500 w-10">{item.product}</span>
          <span className="text-xs font-semibold text-slate-900 flex-1">{item.range}</span>
          <span className={`text-xs font-medium ${item.trend === "up" ? "text-red-500" : "text-green-500"}`}>
            {item.trend === "up" ? "↑" : "→"}
          </span>
          <span className="text-[10px] text-slate-400">{item.confidence}% conf.</span>
        </div>
      ))}
      <p className="text-[10px] text-slate-400 mt-2">Based on Dangote, NNPCL data + global oil news</p>
    </div>
  );
}

// Real, sourced sector figures — NMDPRA fact sheet, July 2026 (latest published).
// No invented traction numbers: the "stats" are the data product itself.
const stats = [
  { value: 71.09, prefix: "", decimals: 2, suffix: "%", label: "Dangote refinery utilization" },
  { value: 35.7, prefix: "", decimals: 1, suffix: " ML/d", label: "National PMS consumption" },
  { value: 22.4, prefix: "", decimals: 1, suffix: " days", label: "PMS stock sufficiency" },
  { value: 4.72, prefix: "", decimals: 2, suffix: " Bscf/d", label: "National gas supply" },
];

const features = [
  "AI chatbot handles depot inquiries 24/7",
  "Voice notes in Hausa, Yoruba, Igbo — auto-transcribed",
  "Secure payments via Providus Bank",
  "Live refinery price board (NNPCL, Dangote & more)",
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 overflow-hidden flex items-center pt-20">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-5" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="secondary"
                className="mb-6 inline-flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Nigeria&apos;s AI-Powered Petroleum Exchange
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6"
            >
              Buy & Sell Fuel{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-accent-300">
                Smarter
              </span>{" "}
              with AI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-white/75 mb-8 leading-relaxed max-w-lg"
            >
              FuelLink connects marketers and depots across Nigeria with AI-powered chat,
              real-time refinery prices, and zero-cost Providus Bank payments.
              No price manipulation. No hidden fees. Just deals.
            </motion.p>

            {/* Feature checklist */}
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-2.5 mb-10"
            >
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </motion.ul>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-3 mb-12"
            >
              <Button
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                onClick={() => window.location.href = "/register/marketer"}
              >
                Join as Marketer
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => window.location.href = "/register/depot"}
              >
                List Your Depot
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6"
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">
                    <AnimatedCounter
                      value={stat.value}
                      prefix={stat.prefix ?? ""}
                      suffix={stat.suffix ?? ""}
                      decimals={stat.decimals ?? 0}
                    />
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-3 text-xs text-white/60"
            >
              Live NMDPRA sector data (Jul 2026, latest published) —{" "}
              <Link href="/intel" className="text-accent-400 hover:text-accent-300 font-semibold underline underline-offset-2">
                explore the Intelligence layer →
              </Link>
            </motion.p>
          </div>

          {/* Right: Interactive previews */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="space-y-4"
          >
            {/* AI Chat */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-secondary-400" />
                <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
                  AI Depot Chat — Live Demo
                </span>
              </div>
              <AIChatPreview />
            </div>

            {/* Price Predictor */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-secondary-400" />
                <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
                  AI Price Intelligence
                </span>
              </div>
              <PricePredictorPreview />
            </div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10"
            >
              <Shield className="w-5 h-5 text-secondary-400 flex-shrink-0" />
              <p className="text-xs text-white/60">
                All transactions secured via{" "}
                <span className="text-white font-semibold">Providus Bank API</span> •
                NMDPRA licensed depots only
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}