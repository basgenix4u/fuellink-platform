// src/app/marketer/subscribe/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Shield,
  Bot,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CreditCard,
  Star,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency } from "@/lib/utils";

const plans = [
  {
    id: "monthly",
    label: "Monthly",
    price: 15_000,
    period: "month",
    badge: null,
    features: [
      "Unlimited depot chat access",
      "AI Price Predictor",
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
    period: "3 months",
    badge: "Save ₦6,000",
    features: [
      "Everything in Monthly",
      "Priority AI chat responses",
      "Advanced price analytics",
      "Export order reports",
      "Dedicated support",
    ],
    popular: true,
  },
  {
    id: "annual",
    label: "Annual",
    price: 120_000,
    period: "year",
    badge: "Best Value — Save ₦60,000",
    features: [
      "Everything in Quarterly",
      "First access to new features",
      "Custom price alerts",
      "API access (coming soon)",
      "Branded invoices",
    ],
  },
];

const perks = [
  { icon: MessageSquare, text: "Chat directly with any depot on the platform" },
  { icon: Bot, text: "AI chatbot answers depot questions 24/7 in your language" },
  { icon: TrendingUp, text: "AI price predictor updated every hour from global data" },
  { icon: Shield, text: "All transactions secured via Providus Bank escrow" },
];

export default function SubscribePage() {
  const [selected, setSelected] = useState("quarterly");
  const [isLoading, setIsLoading] = useState(false);

  const selectedPlan = plans.find((p) => p.id === selected)!;

  const handleSubscribe = async () => {
    setIsLoading(true);
    // TODO: Integrate Providus Bank payment API
    await new Promise((r) => setTimeout(r, 2000));
    setIsLoading(false);
    // redirect to success
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <Badge variant="secondary" className="mb-3 inline-flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Marketer Subscription
        </Badge>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Unlock the full FuelLink experience
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto">
          Subscribe to chat with depots, access AI price predictions, and close deals faster.
          Cancel anytime.
        </p>
      </div>

      {/* Plan selector */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={cn(
              "relative p-5 rounded-2xl border-2 text-left transition-all duration-200",
              selected === plan.id
                ? "border-secondary-500 bg-secondary-50 shadow-lg shadow-secondary-500/10"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 left-4 text-[11px] bg-secondary-500 text-white px-2 py-0.5 rounded-full font-semibold">
                {plan.badge}
              </span>
            )}
            {plan.popular && !plan.badge && (
              <span className="absolute -top-2.5 left-4 text-[11px] bg-primary-600 text-white px-2 py-0.5 rounded-full font-semibold">
                Most Popular
              </span>
            )}

            <p className="font-bold text-slate-900 mb-1">{plan.label}</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(plan.price)}
            </p>
            <p className="text-xs text-slate-500">per {plan.period}</p>

            {selected === plan.id && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-secondary-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Features */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-5">
            What's included in {selectedPlan.label}:
          </h3>
          <ul className="space-y-3">
            {selectedPlan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="w-4 h-4 text-secondary-500 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Payment summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{selectedPlan.label} subscription</span>
                <span className="font-semibold">{formatCurrency(selectedPlan.price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Transaction fee (0.5%)</span>
                <span className="font-semibold">
                  {formatCurrency(Math.round(selectedPlan.price * 0.005))}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(
                    selectedPlan.price + Math.round(selectedPlan.price * 0.005)
                  )}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              loadingText="Processing..."
              rightIcon={<ArrowRight className="w-5 h-5" />}
              onClick={handleSubscribe}
            >
              Pay with Providus Bank
            </Button>

            <div className="flex items-center gap-2 mt-3 justify-center">
              <Shield className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-500">Secured payment via Providus Bank API</p>
            </div>
          </div>

          {/* Why subscribe */}
          <div className="bg-slate-900 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Why subscribe?
            </p>
            <div className="space-y-3">
              {perks.map((perk) => (
                <div key={perk.text} className="flex items-start gap-3">
                  <perk.icon className="w-4 h-4 text-secondary-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-white/80">{perk.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}