// src/app/depot/wallet/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  CreditCard,
  Building,
  Copy,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "escrow_release" | "withdrawal";
  amount: number;
  description: string;
  reference: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
  orderNumber?: string;
}

const transactions: Transaction[] = [
  {
    id: "txn-1",
    type: "escrow_release",
    amount: 37912050,
    description: "Escrow released - Order completed",
    reference: "ESC-2025-001234",
    status: "completed",
    createdAt: "2025-02-19T14:30:00Z",
    orderNumber: "ORD-2025-001234",
  },
  {
    id: "txn-2",
    type: "withdrawal",
    amount: -50000000,
    description: "Bank transfer to GTBank",
    reference: "WTH-2025-005678",
    status: "completed",
    createdAt: "2025-02-19T10:00:00Z",
  },
  {
    id: "txn-3",
    type: "escrow_release",
    amount: 40012500,
    description: "Escrow released - Order completed",
    reference: "ESC-2025-001233",
    status: "completed",
    createdAt: "2025-02-18T16:45:00Z",
    orderNumber: "ORD-2025-001233",
  },
  {
    id: "txn-4",
    type: "withdrawal",
    amount: -25000000,
    description: "Bank transfer to GTBank",
    reference: "WTH-2025-005677",
    status: "pending",
    createdAt: "2025-02-18T14:00:00Z",
  },
  {
    id: "txn-5",
    type: "escrow_release",
    amount: 21978000,
    description: "Escrow released - Order completed",
    reference: "ESC-2025-001232",
    status: "completed",
    createdAt: "2025-02-18T11:30:00Z",
    orderNumber: "ORD-2025-001232",
  },
  {
    id: "txn-6",
    type: "credit",
    amount: 15000000,
    description: "Partial escrow release",
    reference: "ESC-2025-001231",
    status: "completed",
    createdAt: "2025-02-17T09:15:00Z",
  },
];

const bankDetails = {
  bankName: "Guaranty Trust Bank",
  accountNumber: "0123456789",
  accountName: "Pinnacle Oil & Gas Ltd",
};

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const walletBalance = 145892550;
  const pendingBalance = 25000000;
  const totalEarnings = 892500000;

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || txn.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Withdrawal request submitted successfully!");
    setIsWithdrawing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit":
      case "escrow_release":
        return ArrowDownLeft;
      case "debit":
      case "withdrawal":
        return ArrowUpRight;
      default:
        return Wallet;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "credit":
      case "escrow_release":
        return "text-success-600 bg-success-100";
      case "debit":
      case "withdrawal":
        return "text-danger-600 bg-danger-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return { variant: "success" as const, icon: CheckCircle2 };
      case "pending":
        return { variant: "warning" as const, icon: Clock };
      case "failed":
        return { variant: "danger" as const, icon: XCircle };
      default:
        return { variant: "default" as const, icon: Clock };
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
          <p className="text-slate-500">
            Manage your earnings and withdrawals
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleWithdraw}
            isLoading={isWithdrawing}
          >
            <Upload className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-white/70 text-sm mb-1">Available Balance</p>
          <p className="text-3xl font-bold">
            {showBalance ? formatCurrency(walletBalance) : "₦••••••••"}
          </p>
        </motion.div>

        {/* Pending Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-1">Pending Withdrawal</p>
          <p className="text-3xl font-bold text-slate-900">
            {showBalance ? formatCurrency(pendingBalance) : "₦••••••••"}
          </p>
          <p className="text-sm text-warning-600 mt-2">Processing</p>
        </motion.div>

        {/* Total Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-1">Total Earnings (All Time)</p>
          <p className="text-3xl font-bold text-slate-900">
            {showBalance ? formatCurrency(totalEarnings) : "₦••••••••"}
          </p>
          <p className="text-sm text-success-600 mt-2">+₦341M this month</p>
        </motion.div>
      </div>

      {/* Bank Account Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Withdrawal Account
          </h2>
          <Button variant="ghost" size="sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Change Account
          </Button>
        </div>

        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <Building className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{bankDetails.bankName}</p>
            <p className="text-sm text-slate-500">{bankDetails.accountName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-slate-900">
              {bankDetails.accountNumber}
            </span>
            <button
              onClick={() => copyToClipboard(bankDetails.accountNumber)}
              className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Copy className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Transaction History
            </h2>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions..."
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="escrow_release">Escrow Release</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="credit">Credit</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTransactions.map((txn) => {
            const Icon = getTransactionIcon(txn.type);
            const iconColor = getTransactionColor(txn.type);
            const statusInfo = getStatusBadge(txn.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={txn.id}
                className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    iconColor
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">
                      {txn.description}
                    </p>
                    {txn.orderNumber && (
                      <Badge variant="default" size="sm">
                        {txn.orderNumber}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {txn.reference} • {formatDateTime(txn.createdAt)}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={cn(
                      "font-semibold text-lg",
                      txn.amount > 0 ? "text-success-600" : "text-danger-600"
                    )}
                  >
                    {txn.amount > 0 ? "+" : ""}
                    {formatCurrency(Math.abs(txn.amount))}
                  </p>
                  <Badge variant={statusInfo.variant} className="mt-1 gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No transactions found
            </h3>
            <p className="text-slate-500">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Transactions will appear here when you complete orders"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {filteredTransactions.length} transactions
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}