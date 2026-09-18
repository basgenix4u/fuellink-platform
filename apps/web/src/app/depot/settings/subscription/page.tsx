// src/app/depot/settings/subscription/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Crown,
  Sparkles,
  Building2,
  Zap,
  ArrowRight,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    icon: Zap,
    description: "Perfect for trying out FuelLink",
    features: [
      "Basic depot listing",
      "Manual price updates",
      "Up to 10 orders/month",
      "Email support",
    ],
    notIncluded: [
      "Real-time broadcasting",
      "Analytics dashboard",
      "Priority support",
      "API access",
    ],
    current: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: 50000,
    period: "month",
    icon: Building2,
    description: "For growing depot operations",
    features: [
      "Everything in Free",
      "Real-time price broadcasting",
      "Unlimited orders",
      "Basic analytics",
      "Inventory tracking (2 tanks)",
      "Priority email support",
    ],
    notIncluded: ["Custom integrations", "API access"],
    current: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 150000,
    period: "month",
    icon: Sparkles,
    description: "For established depot businesses",
    features: [
      "Everything in Starter",
      "Advanced analytics dashboard",
      "Inventory tracking (5 tanks)",
      "Customer insights",
      "Ratings management",
      "Priority phone support",
      "Custom reports",
    ],
    notIncluded: ["API access"],
    current: false,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 400000,
    period: "month",
    icon: Crown,
    description: "For large-scale operations",
    features: [
      "Everything in Professional",
      "Unlimited tank tracking",
      "Full API access",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 priority support",
      "Custom branding",
      "SLA guarantee",
    ],
    notIncluded: [],
    current: true,
  },
];

const billingHistory = [
  { id: "inv-001", date: "Feb 1, 2025", amount: 400000, status: "paid", plan: "Enterprise" },
  { id: "inv-002", date: "Jan 1, 2025", amount: 400000, status: "paid", plan: "Enterprise" },
  { id: "inv-003", date: "Dec 1, 2024", amount: 400000, status: "paid", plan: "Enterprise" },
  { id: "inv-004", date: "Nov 1, 2024", amount: 150000, status: "paid", plan: "Professional" },
  { id: "inv-005", date: "Oct 1, 2024", amount: 150000, status: "paid", plan: "Professional" },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState("enterprise");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const currentPlan = plans.find((p) => p.current);

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success(`Subscription updated to ${planId} plan!`);
    setIsUpgrading(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
        <p className="text-slate-500">
          Manage your subscription plan and billing
        </p>
      </div>

      {/* Current Plan Banner */}
      {currentPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <currentPlan.icon className="w-7 h-7" />
              </div>
              <div>
                <Badge className="bg-white/20 text-white mb-1">Current Plan</Badge>
                <h2 className="text-2xl font-bold">{currentPlan.name}</h2>
                <p className="text-white/80">
                  {formatCurrency(currentPlan.price)}/month
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-white/70 text-sm">Next billing date</p>
                <p className="font-semibold">March 1, 2025</p>
              </div>
              <Button variant="white" size="md">
                Manage Billing
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="bg-slate-100 rounded-xl p-1 inline-flex">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
              billingCycle === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
              billingCycle === "yearly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600"
            )}
          >
            Yearly
            <Badge variant="success" size="sm" className="ml-2">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          const price = billingCycle === "yearly" 
            ? Math.round(plan.price * 12 * 0.8) 
            : plan.price;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative bg-white rounded-2xl border-2 p-6 transition-all",
                plan.current
                  ? "border-primary-500 ring-2 ring-primary-100"
                  : plan.popular
                  ? "border-secondary-500"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary">Most Popular</Badge>
                </div>
              )}

              {plan.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="primary">Current Plan</Badge>
                </div>
              )}

              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">
                  {plan.price === 0 ? "Free" : formatCurrency(price)}
                </span>
                {plan.price > 0 && (
                  <span className="text-slate-500">
                    /{billingCycle === "yearly" ? "year" : "month"}
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-success-500 flex-shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.current ? "outline" : "primary"}
                size="md"
                className="w-full"
                disabled={plan.current}
                onClick={() => handleUpgrade(plan.id)}
                isLoading={isUpgrading && selectedPlan === plan.id}
              >
                {plan.current ? "Current Plan" : "Upgrade"}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Billing History
            </h2>
            <p className="text-sm text-slate-500">
              Download invoices for your records
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                  Invoice
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                  Date
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                  Plan
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                  Amount
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-slate-50 hover:bg-slate-50"
                >
                  <td className="py-4 px-6">
                    <span className="font-medium text-slate-900">
                      {invoice.id.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{invoice.date}</td>
                  <td className="py-4 px-6">
                    <Badge variant="default">{invoice.plan}</Badge>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant="success">Paid</Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Payment Method */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Payment Method
        </h2>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-slate-900">•••• •••• •••• 4242</p>
              <p className="text-sm text-slate-500">Expires 12/2026</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Update
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
