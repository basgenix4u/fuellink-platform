// src/components/landing/SolutionSection.tsx
"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Bot,
  TrendingUp,
  Shield,
  MessageSquare,
  Newspaper,
  Megaphone,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Mic,
  Zap,
} from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/shared/Button";

const solutions = [
  {
    icon: Bot,
    title: "AI Depot Chatbot",
    description:
      "Every depot gets a dedicated AI that knows their stock, products, and price range. Marketers chat in any language — Hausa, Yoruba, Igbo, English — and get answers instantly, 24/7.",
    features: [
      "Voice notes auto-transcribed (Hausa, Yoruba, Igbo)",
      "Answers price, stock & availability questions",
      "Escalates to human when a deal is ready",
    ],
    color: "from-primary-500 to-primary-600",
    bgColor: "bg-primary-50",
    iconColor: "text-primary-600",
  },
  {
    icon: TrendingUp,
    title: "AI Price Predictor",
    description:
      "Our AI monitors global crude oil news, NNPCL bulletins, Dangote announcements, FX rates, and refinery updates every minute — then predicts today's price range for PMS, AGO, DPK, LPG, and JET-A1.",
    features: [
      "Real-time scan of oil & gas news worldwide",
      "Product-specific predictions with confidence score",
      "Updated every 60 minutes automatically",
    ],
    color: "from-secondary-500 to-secondary-600",
    bgColor: "bg-secondary-50",
    iconColor: "text-secondary-600",
  },
  {
    icon: Shield,
    title: "Providus Bank Payments",
    description:
      "We chose Providus Bank's API specifically for its near-zero transfer costs on large transactions. With orders running up to ₦500M+, every kobo in bank charges matters.",
    features: [
      "Escrow-protected — funds released on QR scan",
      "Near-zero bank transfer cost (critical at ₦5B/day volume)",
      "Instant wallet settlement after delivery",
    ],
    color: "from-success-500 to-success-600",
    bgColor: "bg-success-50",
    iconColor: "text-success-600",
  },
  {
    icon: BarChart3,
    title: "Live Refinery Price Board",
    description:
      "The ONLY public prices on FuelLink are refinery prices — Dangote, NNPCL, NDPR, Walter Smith, and more. Depot prices stay private until the negotiation begins in chat.",
    features: [
      "All 10 Nigerian refineries listed",
      "Official NNPCL & Dangote prices updated regularly",
      "Market average calculated automatically",
    ],
    color: "from-accent-500 to-accent-600",
    bgColor: "bg-accent-50",
    iconColor: "text-accent-600",
  },
  {
    icon: Megaphone,
    title: "Depot Advertising",
    description:
      "Depots can run targeted campaigns to reach active marketers. Email blasts, homepage banners, and boosted depot listings — pay per campaign, not monthly.",
    features: [
      "Email blasts to verified marketer database",
      "Homepage and feed banner placements",
      "Performance analytics per campaign",
    ],
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: Newspaper,
    title: "Oil & Gas Media Hub",
    description:
      "Stay informed with FuelLink's curated media hub — industry news, price analysis, regulation updates, and market commentary. The intelligence layer that makes every deal smarter.",
    features: [
      "Curated daily oil & gas news",
      "Price analysis & market commentary",
      "NMDPRA regulatory updates",
    ],
    color: "from-slate-600 to-slate-700",
    bgColor: "bg-slate-50",
    iconColor: "text-slate-600",
  },
];

const comparisonData = [
  {
    metric: "Price Discovery",
    before: "2–4 hours of calls",
    after: "< 30 seconds via AI",
    improvement: "99%",
  },
  {
    metric: "Transaction Security",
    before: "None — cash/trust-based",
    after: "Providus escrow",
    improvement: "100%",
  },
  {
    metric: "Price Accuracy",
    before: "Outdated by the time you act",
    after: "AI-predicted, updated every hour",
    improvement: "Real-time",
  },
  {
    metric: "Language Barrier",
    before: "English only in most systems",
    after: "Hausa, Yoruba, Igbo voice notes",
    improvement: "Inclusive",
  },
];

export function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="solutions" ref={ref} className="py-24 bg-slate-50">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Every Problem. One Platform.
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            FuelLink was built to solve the real, daily pain points of Nigeria's petroleum
            supply chain — with AI at the center of everything.
          </p>
        </motion.div>

        {/* Solution cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {solutions.map((solution, i) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl ${solution.bgColor} flex items-center justify-center mb-5`}>
                <solution.icon className={`w-6 h-6 ${solution.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{solution.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">{solution.description}</p>
              <ul className="space-y-2">
                {solution.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-500">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${solution.iconColor} flex-shrink-0 mt-0.5`} />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Before/After comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg"
        >
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-secondary-400" />
              <h3 className="text-white font-bold text-lg">Before vs After FuelLink</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-red-400 uppercase tracking-wider">Before</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-success-600 uppercase tracking-wider">With FuelLink</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Improvement</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={row.metric} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.metric}</td>
                    <td className="px-6 py-4 text-sm text-red-500">{row.before}</td>
                    <td className="px-6 py-4 text-sm text-success-700 font-medium">{row.after}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-success-100 text-success-700">
                        {row.improvement}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
            Join Nigeria's Smartest Fuel Exchange
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}