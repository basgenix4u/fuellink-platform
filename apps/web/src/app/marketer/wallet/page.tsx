// src/app/marketer/wallet/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  History,
  Shield,
  Plus,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

const transactions = [
  {
    id: "txn-1",
    type: "debit",
    amount: 37950000,
    description: "Payment for Order #ORD-2025-001234",
    status: "completed",
    date: "2025-02-19T10:45:00Z",
    method: "Wallet",
  },
  {
    id: "txn-2",
    type: "credit",
    amount: 50000000,
    description: "Wallet Funding via Bank Transfer",
    status: "completed",
    date: "2025-02-18T09:00:00Z",
    method: "Bank Transfer",
  },
  {
    id: "txn-3",
    type: "debit",
    amount: 40050000,
    description: "Payment for Order #ORD-2025-001233",
    status: "completed",
    date: "2025-02-17T14:30:00Z",
    method: "Wallet",
  },
];

export default function MarketerWalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [isFunding, setIsFunding] = useState(false);

  const balance = 45500000;
  const escrowBalance = 37950000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
          <p className="text-slate-500">Manage your funds and payments</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsFunding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Fund Wallet
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Main Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="font-medium text-white/90">Available Balance</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-4xl font-bold mb-6">
            {showBalance ? formatCurrency(balance) : "₦••••••••"}
          </p>
          <div className="flex gap-3">
            <Button variant="white" size="sm" className="flex-1">
              Fund
            </Button>
            <Button variant="outline" size="sm" className="flex-1 border-white/30 text-white hover:bg-white/10">
              Withdraw
            </Button>
          </div>
        </motion.div>

        {/* Escrow Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-medium text-slate-700">Locked in Escrow</span>
            </div>
            <Badge variant="warning">Active Orders</Badge>
          </div>
          <p className="text-4xl font-bold text-slate-900 mb-6">
            {showBalance ? formatCurrency(escrowBalance) : "₦••••••••"}
          </p>
          <p className="text-sm text-slate-500">
            Funds are held securely until you confirm loading is complete.
          </p>
        </motion.div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Statement
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.map((txn) => (
            <div key={txn.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    txn.type === "credit" ? "bg-success-100 text-success-600" : "bg-slate-100 text-slate-600"
                  )}>
                    {txn.type === "credit" ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{txn.description}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>{formatDateTime(txn.date)}</span>
                      <span>•</span>
                      <span>{txn.method}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-bold text-lg",
                    txn.type === "credit" ? "text-success-600" : "text-slate-900"
                  )}>
                    {txn.type === "credit" ? "+" : "-"}{formatCurrency(txn.amount)}
                  </p>
                  <Badge variant="success" size="sm" className="mt-1">
                    {txn.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}