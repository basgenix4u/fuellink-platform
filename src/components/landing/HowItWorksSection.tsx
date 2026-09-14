// src/components/landing/HowItWorksSection.tsx
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import {
  Building2,
  ShoppingCart,
  Search,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Bot,
  TrendingUp,
  BarChart3,
  Shield,
  Mic,
  Newspaper,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";

type UserType = "marketer" | "depot";

const userTabs: { id: UserType; label: string; icon: React.ElementType }[] = [
  { id: "marketer", label: "For Marketers", icon: ShoppingCart },
  { id: "depot", label: "For Depots", icon: Building2 },
];

const marketerSteps = [
  {
    icon: Search,
    title: "Subscribe & Explore",
    description:
      "Pick a subscription plan and instantly access Nigeria's largest verified depot network. Browse by state, product, and availability.",
    visual: "🔍 Browse 127+ verified depots",
  },
  {
    icon: TrendingUp,
    title: "Check AI Price Predictions",
    description:
      "Our AI scans global oil news, NNPCL bulletins, and Dangote updates every minute to predict today's price range before you negotiate.",
    visual: "📈 PMS: ₦893–₦910 today (87% confidence)",
  },
  {
    icon: Bot,
    title: "Chat With Depot AI",
    description:
      "Ask the depot's AI assistant anything — available stock, price, delivery, minimum order. Send voice notes in Hausa or any language.",
    visual: "🎙 Voice note → Transcribed → Replied instantly",
  },
  {
    icon: MessageSquare,
    title: "Negotiate & Confirm",
    description:
      "Once the AI gives you the depot's price, escalate to the human depot manager for final negotiation — all inside FuelLink.",
    visual: "💬 Price agreed: ₦905/L for 33,000L",
  },
  {
    icon: CreditCard,
    title: "Pay Securely via Providus",
    description:
      "Pay through our Providus Bank integration. Funds go into escrow. Released to depot only after you confirm delivery.",
    visual: "🏦 Providus transfer • Escrow protected",
  },
  {
    icon: CheckCircle2,
    title: "Collect & Done",
    description:
      "Show your QR code at the depot gate. Loading is confirmed. Escrow releases. Transaction complete.",
    visual: "✅ QR scanned • Payment released",
  },
];

const depotSteps = [
  {
    icon: Building2,
    title: "Register Your Depot Free",
    description:
      "List your depot with your NMDPRA license, tank configurations, and products. Verification takes 24–48 hours.",
    visual: "📋 NMDPRA License verified in 24hrs",
  },
  {
    icon: Bot,
    title: "Your AI Is Ready",
    description:
      "FuelLink sets up an AI chatbot for your depot automatically. It knows your products, availability, and price range. It answers marketers 24/7 — even when you sleep.",
    visual: "🤖 AI active • 24/7 marketer support",
  },
  {
    icon: BarChart3,
    title: "Set Private Prices",
    description:
      "Set your price per product. These are NOT publicly shown to marketers — only revealed by your AI during chat. This creates room for negotiation and keeps you in control.",
    visual: "🔒 Price is private until chat begins",
  },
  {
    icon: MessageSquare,
    title: "Close Deals in Chat",
    description:
      "When a marketer wants to negotiate, you join the conversation. Agree a price, confirm the order — all within FuelLink.",
    visual: "✅ Order confirmed: 33,000L AGO",
  },
  {
    icon: Shield,
    title: "Get Paid Instantly",
    description:
      "Marketer pays via Providus Bank. Funds are escrowed. When the QR code is scanned at your gate, money hits your wallet immediately.",
    visual: "💰 ₦37.6M settled to your wallet",
  },
  {
    icon: Newspaper,
    title: "Optionally Advertise",
    description:
      "Run targeted ads to reach more marketers. Email blasts, homepage banners, or boosted depot listings. Pay per campaign, not monthly.",
    visual: "📢 Reach 3,400+ active marketers",
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<UserType>("marketer");
  const [activeStep, setActiveStep] = useState(0);

  const steps = activeTab === "marketer" ? marketerSteps : depotSteps;

  return (
    <section id="how-it-works" ref={ref} className="py-24 bg-white">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            How FuelLink Works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From discovery to delivery — a streamlined AI-powered flow
            for both marketers and depots.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-100 rounded-2xl p-1.5 inline-flex">
            {userTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setActiveStep(0); }}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-white text-primary-700 shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-5 gap-8"
          >
            {/* Step list */}
            <div className="lg:col-span-2 space-y-2">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={cn(
                    "w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all duration-200",
                    activeStep === i
                      ? "bg-primary-50 border-2 border-primary-200"
                      : "bg-white border-2 border-transparent hover:border-slate-100 hover:bg-slate-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                      activeStep === i
                        ? "bg-primary-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "font-semibold text-sm",
                        activeStep === i ? "text-primary-700" : "text-slate-700"
                      )}
                    >
                      {i + 1}. {step.title}
                    </p>
                    {activeStep === i && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Step detail */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="bg-gradient-to-br from-primary-900 to-primary-700 rounded-3xl p-8 h-full min-h-[360px] flex flex-col justify-between text-white relative overflow-hidden"
                >
                  {/* Background glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-500/15 rounded-full blur-[80px]" />

                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                      {(() => {
                        const Icon = steps[activeStep].icon;
                        return <Icon className="w-7 h-7 text-secondary-300" />;
                      })()}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                        Step {activeStep + 1} of {steps.length}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold mb-4">
                      {steps[activeStep].title}
                    </h3>

                    <p className="text-white/75 leading-relaxed text-sm">
                      {steps[activeStep].description}
                    </p>
                  </div>

                  {/* Visual callout */}
                  <div className="relative mt-8 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10">
                    <p className="text-sm font-medium text-white">
                      {steps[activeStep].visual}
                    </p>
                  </div>

                  {/* Step navigation */}
                  <div className="relative flex items-center justify-between mt-6">
                    <div className="flex gap-2">
                      {steps.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveStep(i)}
                          className={cn(
                            "rounded-full transition-all duration-200",
                            i === activeStep
                              ? "w-8 h-2 bg-secondary-400"
                              : "w-2 h-2 bg-white/20 hover:bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveStep((s) => Math.min(s + 1, steps.length - 1))}
                      disabled={activeStep === steps.length - 1}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="w-5 h-5" />}
            onClick={() =>
              (window.location.href =
                activeTab === "marketer"
                  ? "/register/marketer"
                  : "/register/depot")
            }
          >
            {activeTab === "marketer" ? "Start as Marketer" : "Register Your Depot"}
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}
