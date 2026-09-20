// src/components/landing/PricingSection.tsx
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import {
  Check,
  Sparkles,
  Shield,
  Building2,
  ShoppingCart,
  ArrowRight,
  Zap,
  MessageSquare,
  TrendingUp,
  Megaphone,
  Newspaper,
  Bot,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency } from "@/lib/utils";

// Transaction fee calculator
function TransactionFeeCalculator() {
  const [orderValue, setOrderValue] = useState(5_000_000); // ₦5M default
  const FEE_RATE = 0.005; // 0.5%

  const fee = Math.round(orderValue * FEE_RATE);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary-600" />
        <h3 className="font-bold text-slate-900">Transaction Fee Calculator</h3>
      </div>

      <div className="mb-4">
        <label className="text-sm text-slate-600 mb-2 block">
          Order Value: <span className="font-bold text-slate-900">{formatCurrency(orderValue)}</span>
        </label>
        <input
          type="range"
          min={500_000}
          max={500_000_000}
          step={500_000}
          value={orderValue}
          onChange={(e) => setOrderValue(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>₦500K</span>
          <span>₦500M</span>
        </div>
      </div>

      <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Platform fee (0.5%)</span>
          <span className="font-bold text-primary-700">{formatCurrency(fee)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">You pay / receive</span>
          <span className="font-bold text-slate-900">{formatCurrency(orderValue - fee)}</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        * Fee is split equally. No per-litre charges. No hidden costs.
        Payment via Providus Bank — near-zero transfer cost.
      </p>
    </div>
  );
}

const depotFeatures = [
  "List depot & products for free",
  "AI chatbot answers marketer questions 24/7",
  "Voice note support (Hausa, Yoruba, Igbo + more)",
  "Private price-setting — only shared via chat",
  "Advertise products to thousands of marketers",
  "Analytics dashboard",
  "NMDPRA compliance dashboard",
  "Direct Providus Bank payouts",
];

const marketerPlans = [
  {
    id: "monthly",
    label: "Monthly",
    price: 15_000,
    period: "/month",
    badge: null,
    features: [
      "Unlimited depot chat access",
      "AI price predictor",
      "Live refinery price board",
      "Order management",
      "Dispute resolution",
      "Email + in-app alerts",
    ],
  },
  {
    id: "quarterly",
    label: "Quarterly",
    price: 39_000,
    period: "/quarter",
    badge: "Save 13%",
    features: [
      "Everything in Monthly",
      "Priority AI chat responses",
      "Advanced price analytics",
      "Export reports",
      "Dedicated support",
    ],
  },
  {
    id: "annual",
    label: "Annual",
    price: 120_000,
    period: "/year",
    badge: "Best Value",
    features: [
      "Everything in Quarterly",
      "First access to new features",
      "Custom alerts & notifications",
      "API access (coming soon)",
      "Branded invoices",
    ],
  },
];

export function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<"marketer" | "depot">("marketer");

  return (
    <section id="pricing" ref={ref} className="py-24 bg-slate-50">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, Fair Pricing
          </Badge>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            One model. No surprises.
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Depots join free. Marketers subscribe for full access.
            We earn a small transaction fee — only when a deal closes.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm inline-flex">
            {[
              { id: "marketer" as const, label: "Marketer Plans", icon: ShoppingCart },
              { id: "depot" as const, label: "For Depot Owners", icon: Building2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary-600 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* MARKETER PLANS */}
        {activeTab === "marketer" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {marketerPlans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className={cn(
                    "bg-white rounded-2xl border p-6 relative",
                    plan.id === "quarterly"
                      ? "border-primary-200 shadow-xl shadow-primary-500/10 ring-2 ring-primary-500/20"
                      : "border-slate-200 shadow-md"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant={plan.id === "annual" ? "success" : "primary"} className="text-xs">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.label}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-slate-500 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.id === "quarterly" ? "primary" : "outline"}
                    fullWidth
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Get Started
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Transaction fee explainer */}
            <div className="grid md:grid-cols-2 gap-6">
              <TransactionFeeCalculator />
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-success-600" />
                  <h3 className="font-bold text-slate-900">Why Transaction Fees?</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  We charge a small <strong>0.5% fee</strong> on every completed order — not per litre.
                  This aligns us with your success. No deal, no fee.
                </p>
                <div className="space-y-3">
                  {[
                    "Providus Bank handles payments at near-zero bank charges",
                    "Suitable for transactions up to ₦500M+ per order",
                    "Funds held in escrow until delivery confirmed",
                    "Instant settlement after QR code scan at depot",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* DEPOT PLAN */}
        {activeTab === "depot" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 gap-8 items-start"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8">
              <Badge variant="success" className="mb-4">Free to Join</Badge>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Depot Account</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-slate-900">₦0</span>
                <span className="text-slate-500">to list your depot</span>
              </div>
              <ul className="space-y-3 mb-8">
                {depotFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="primary" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                Register Your Depot
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
                <Megaphone className="w-8 h-8 text-secondary-400 mb-3" />
                <h4 className="font-bold text-lg mb-2">Advertise Your Products</h4>
                <p className="text-white/75 text-sm mb-4">
                  Boost your depot visibility. Reach active marketers via email blasts
                  and homepage banners. Pay only for results.
                </p>
                <div className="bg-white/10 rounded-xl p-3 text-sm">
                  Starting from <strong>₦25,000</strong> per campaign
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
                <Bot className="w-6 h-6 text-primary-600 mb-3" />
                <h4 className="font-bold text-slate-900 mb-2">AI Handles Your Inquiries</h4>
                <p className="text-sm text-slate-600">
                  Your depot gets its own AI assistant trained on your products,
                  pricing range, and availability. Marketers ask — AI answers. You close deals.
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white">
                <TrendingUp className="w-6 h-6 text-secondary-400 mb-3" />
                <h4 className="font-bold mb-2">How We Both Win</h4>
                <p className="text-sm text-white/70">
                  We earn 0.5% per closed transaction. That&apos;s it.
                  No monthly fees for depots. We grow when you grow.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </Container>
    </section>
  );
}