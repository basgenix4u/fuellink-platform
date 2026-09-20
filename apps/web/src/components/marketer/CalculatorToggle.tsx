// src/components/marketer/CalculatorToggle.tsx

"use client";

import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalculatorToggleProps {
  onClick: () => void;
  isOpen: boolean;
}

export function CalculatorToggle({ onClick, isOpen }: CalculatorToggleProps) {
  if (isOpen) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full shadow-lg",
        "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white",
        "flex items-center justify-center",
        "hover:shadow-xl transition-shadow"
      )}
    >
      <Calculator className="w-6 h-6" />
      
      {/* Pulse Animation */}
      <span className="absolute inset-0 rounded-full bg-secondary-500 animate-ping opacity-25" />
    </motion.button>
  );
}