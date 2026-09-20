// src/components/landing/ProblemSection.tsx

"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Phone,
  Clock,
  AlertTriangle,
  HelpCircle,
  XCircle,
  TrendingDown,
  MessageSquare,
  Truck,
} from "lucide-react";
import { Container } from "@/components/shared/Container";

const problems = [
  {
    icon: Phone,
    title: "Endless Phone Calls",
    description:
      "Marketers spend 2-4 hours daily calling depots to check prices. Information is often outdated by the time they act.",
    stat: "2-4 hrs",
    statLabel: "wasted daily",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    icon: HelpCircle,
    title: "Price Opacity",
    description:
      "No single source of truth for depot prices. Middlemen profit from information asymmetry while marketers overpay.",
    stat: "₦10-25",
    statLabel: "overpaid per litre",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Truck,
    title: "Phantom Inventory",
    description:
      "Trucks dispatched based on verbal assurances often arrive to find depots sold out. Wasted trips cost millions.",
    stat: "₦200K+",
    statLabel: "per wasted trip",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Zero Security",
    description:
      "Transactions worth ₦30-50M happen via bank transfers to personal accounts. No escrow, no protection, no recourse.",
    stat: "₦20B+",
    statLabel: "lost to fraud yearly",
    color: "text-red-600",
    bgColor: "bg-red-600/10",
  },
];

const chaosMessages = [
  { text: "Bros, wetin be current price for AGO?", time: "6:32 AM" },
  { text: "Oga price don change o, now na ₦1150", time: "6:45 AM" },
  { text: "Abeg which depot get stock?", time: "7:01 AM" },
  { text: "Truck don reach, dem say no stock again 😭", time: "11:23 AM" },
  { text: "Send account make I transfer", time: "2:15 PM" },
  { text: "I never see the money, send proof", time: "4:30 PM" },
];

function ChatBubble({
  message,
  index,
}: {
  message: { text: string; time: string };
  index: number;
}) {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`flex ${isEven ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isEven
            ? "bg-slate-200 text-slate-800 rounded-tl-none"
            : "bg-primary-500 text-white rounded-tr-none"
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <p
          className={`text-xs mt-1 ${
            isEven ? "text-slate-500" : "text-white/70"
          }`}
        >
          {message.time}
        </p>
      </div>
    </motion.div>
  );
}

export function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-slate-50 overflow-hidden">
      <Container size="wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-red-600 font-semibold text-sm uppercase tracking-wider mb-4">
              <XCircle className="w-4 h-4" />
              The Current Reality
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              The Petroleum Trading{" "}
              <span className="text-red-500">Chaos</span>
            </h2>
            <p className="text-lg text-slate-600">
              Every day, thousands of marketers lose money, time, and peace of
              mind navigating a broken system. Here&apos;s what they face:
            </p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Problem Cards */}
          <div className="space-y-6">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl ${problem.bgColor} flex items-center justify-center`}
                  >
                    <problem.icon className={`w-6 h-6 ${problem.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {problem.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      {problem.description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${problem.color}`}>
                        {problem.stat}
                      </span>
                      <span className="text-slate-500 text-sm">
                        {problem.statLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right - WhatsApp Chaos Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            {/* Phone Frame */}
            <div className="bg-slate-900 rounded-[3rem] p-3 shadow-2xl max-w-sm mx-auto">
              <div className="bg-white rounded-[2.5rem] overflow-hidden">
                {/* Status Bar */}
                <div className="bg-primary-600 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        Fuel Dealers Lagos
                      </p>
                      <p className="text-white/70 text-xs">
                        347 participants
                      </p>
                    </div>
                  </div>
                  <Phone className="w-5 h-5 text-white" />
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-3 bg-[#E5DDD5] min-h-[400px]">
                  {chaosMessages.map((message, index) => (
                    <ChatBubble key={index} message={message} index={index} />
                  ))}

                  {/* Typing Indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 bg-slate-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-slate-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-slate-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Floating Warning Labels */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="absolute -top-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
            >
              ❌ No Verification
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.7 }}
              className="absolute top-1/3 -left-8 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
            >
              ⚠️ Outdated Info
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.8 }}
              className="absolute bottom-20 -right-4 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
            >
              💸 Payment Risk
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-xl text-slate-700 font-medium">
            The industry loses over{" "}
            <span className="text-red-600 font-bold">₦100 Billion</span>{" "}
            annually to these inefficiencies.
          </p>
          <p className="text-lg text-slate-500 mt-2">
            There has to be a better way...
          </p>
        </motion.div>
      </Container>
    </section>
  );
}