// src/components/landing/CTASection.tsx

"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/shared/Button";

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-3xl p-8 md:p-16 overflow-hidden"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                    Ready to Transform Your{" "}
                    <span className="text-secondary-400">
                      Petroleum Trading?
                    </span>
                  </h2>
                  <p className="text-lg text-white/80 mb-8">
                    Join thousands of marketers and depot owners who are already
                    saving time, money, and stress with FuelLink. Get started in
                    minutes.
                  </p>

                  {/* Benefits */}
                  <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    <div className="flex items-center gap-2 text-white/90">
                      <Zap className="w-5 h-5 text-secondary-400" />
                      <span>Instant Setup</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Shield className="w-5 h-5 text-secondary-400" />
                      <span>Secure Platform</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Clock className="w-5 h-5 text-secondary-400" />
                      <span>24/7 Support</span>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      variant="secondary"
                      size="xl"
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      Create Free Account
                    </Button>
                    <Button
                      variant="outline"
                      size="xl"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      Schedule Demo
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Right - Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-white mb-2">5 min</p>
                  <p className="text-white/70">To Get Started</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-white mb-2">₦0</p>
                  <p className="text-white/70">To Create Account</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-secondary-400 mb-2">
                    15%
                  </p>
                  <p className="text-white/70">Average Savings</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <p className="text-4xl font-bold text-secondary-400 mb-2">
                    100%
                  </p>
                  <p className="text-white/70">Secure Transactions</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}