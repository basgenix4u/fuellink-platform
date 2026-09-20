// src/app/depot/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Eye,
  QrCode,
  Wallet,
  Fuel,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge, StockLevelBadge, OrderStatusBadge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils";

// Stats data
const stats = [
  {
    label: "Today's Revenue",
    value: 45360000,
    fee: 9900, // Platform fee deducted
    change: 12.5,
    trend: "up",
    icon: DollarSign,
    color: "primary",
  },
  {
    label: "Pending Orders",
    value: 5,
    subtext: "12 trucks total",
    icon: ShoppingCart,
    color: "secondary",
  },
  {
    label: "Total Stock",
    value: 78,
    suffix: "%",
    change: -5,
    trend: "down",
    icon: Package,
    color: "accent",
  },
  {
    label: "Active Customers",
    value: 127,
    change: 5.2,
    trend: "up",
    icon: Users,
    color: "success",
  },
];

// Recent orders with multiple trucks
const recentOrders = [
  {
    id: "ORD-2025-001238",
    customer: "Sahara Energy Resources",
    product: "AGO",
    trucks: 3,
    totalQuantity: 111000,
    amount: 127665000,
    platformFee: 27750, // 111000 × 0.25
    status: "confirmed",
    time: "2025-02-19T10:45:00Z",
  },
  {
    id: "ORD-2025-001237",
    customer: "Matrix Petroleum Ltd",
    product: "PMS",
    trucks: 2,
    totalQuantity: 78000,
    amount: 69420000,
    platformFee: 19500,
    status: "loading",
    time: "2025-02-19T10:30:00Z",
  },
  {
    id: "ORD-2025-001236",
    customer: "Golden Oil Company",
    product: "AGO",
    trucks: 1,
    totalQuantity: 33000,
    amount: 37950000,
    platformFee: 8250,
    status: "pending",
    time: "2025-02-19T10:15:00Z",
  },
  {
    id: "ORD-2025-001235",
    customer: "Premier Fuel Distributors",
    product: "DPK",
    trucks: 1,
    totalQuantity: 20000,
    amount: 22000000,
    platformFee: 5000,
    status: "completed",
    time: "2025-02-19T09:45:00Z",
  },
];

// Product prices with stock as %
const productPrices = [
  {
    type: "AGO",
    name: "Diesel",
    price: 1150,
    previousPrice: 1145,
    stockPercentage: 78,
    lastUpdated: "2025-02-19T08:30:00Z",
  },
  {
    type: "PMS",
    name: "Petrol",
    price: 890,
    previousPrice: 885,
    stockPercentage: 85,
    lastUpdated: "2025-02-19T08:15:00Z",
  },
  {
    type: "DPK",
    name: "Kerosene",
    price: 1100,
    previousPrice: 1100,
    stockPercentage: 45,
    lastUpdated: "2025-02-18T16:00:00Z",
  },
];

const quickActions = [
  {
    label: "Update Prices",
    description: "Broadcast to all marketers",
    href: "/depot/prices",
    icon: DollarSign,
    color: "bg-primary-500",
  },
  {
    label: "Scan QR Code",
    description: "Verify truck for loading",
    href: "/depot/verify",
    icon: QrCode,
    color: "bg-secondary-500",
  },
  {
    label: "View Orders",
    description: "Manage incoming orders",
    href: "/depot/orders",
    icon: ShoppingCart,
    color: "bg-purple-500",
  },
  {
    label: "Wallet",
    description: "View earnings & fees",
    href: "/depot/wallet",
    icon: Wallet,
    color: "bg-emerald-500",
  },
];

export default function DepotDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Welcome back! Here&apos;s what&apos;s happening at your depot.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/depot/prices">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Update Prices
            </Button>
          </Link>
        </div>
      </div>

      {/* Platform Fee Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Fuel className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Platform Fee: ₦0.25 per litre</h3>
            <p className="text-sm text-amber-700">
              This fee is automatically deducted from your settlement when orders complete. 
              Today&apos;s total fees: <strong>₦{formatNumber(9900)}</strong>
            </p>
          </div>
          <Link href="/depot/wallet">
            <Button variant="ghost" size="sm">View Details</Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  stat.color === "primary" && "bg-primary-50 text-primary-600",
                  stat.color === "secondary" && "bg-secondary-50 text-secondary-600",
                  stat.color === "accent" && "bg-amber-50 text-amber-600",
                  stat.color === "success" && "bg-emerald-50 text-emerald-600"
                )}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.change !== undefined && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
                    stat.trend === "up" ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
                  )}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">
              {stat.label.includes("Revenue") && "₦"}
              {formatNumber(stat.value)}
              {stat.suffix || ""}
            </p>
            {stat.fee && (
              <p className="text-xs text-amber-600 mt-1">
                Fee deducted: ₦{formatNumber(stat.fee)}
              </p>
            )}
            {stat.subtext && (
              <p className="text-xs text-slate-500 mt-1">{stat.subtext}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
          >
            <Link
              href={action.href}
              className="group block bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-lg hover:border-primary-200 transition-all"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform",
                  action.color
                )}
              >
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{action.label}</h3>
              <p className="text-sm text-slate-500">{action.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            <Link
              href="/depot/orders"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Order</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Customer</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Details</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Settlement</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-500">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-500"></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-900">{order.id}</p>
                      <p className="text-xs text-slate-500">{formatRelativeTime(order.time)}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-slate-700">{order.customer}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">{order.product}</Badge>
                        <span className="text-sm text-slate-600">
                          {order.trucks} truck{order.trucks > 1 ? "s" : ""} • {formatNumber(order.totalQuantity)}L
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.amount - order.platformFee)}
                      </p>
                      <p className="text-xs text-amber-600">
                        Fee: ₦{formatNumber(order.platformFee)}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        href={`/depot/orders/${order.id}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors inline-flex"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Current Prices & Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Prices & Stock</h2>
            <Link href="/depot/prices" className="text-sm font-medium text-primary-600">
              Edit
            </Link>
          </div>

          <div className="p-6 space-y-4">
            {productPrices.map((product) => {
              const priceChange = product.price - product.previousPrice;

              return (
                <div
                  key={product.type}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="primary" className="mb-1">{product.type}</Badge>
                      <p className="text-sm text-slate-500">{product.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        ₦{formatNumber(product.price)}
                      </p>
                      {priceChange !== 0 && (
                        <div
                          className={cn(
                            "flex items-center justify-end gap-1 text-xs font-medium",
                            priceChange > 0 ? "text-emerald-600" : "text-red-600"
                          )}
                        >
                          {priceChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {priceChange > 0 ? "+" : ""}₦{priceChange}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Stock Level</span>
                      <StockLevelBadge percentage={product.stockPercentage} size="sm" />
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          product.stockPercentage >= 70 && "bg-emerald-500",
                          product.stockPercentage >= 40 && product.stockPercentage < 70 && "bg-amber-500",
                          product.stockPercentage < 40 && "bg-red-500"
                        )}
                        style={{ width: `${product.stockPercentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Updated {formatRelativeTime(product.lastUpdated)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-6 pt-0">
            <Link href="/depot/prices">
              <Button variant="outline" size="md" fullWidth leftIcon={<DollarSign className="w-4 h-4" />}>
                Update All Prices
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Verification CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl p-6 text-white"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <QrCode className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ready to Verify Trucks?</h3>
              <p className="text-white/80">
                Scan driver QR codes to authorize loading
              </p>
            </div>
          </div>
          <Link href="/depot/verify">
            <Button variant="white" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Open Scanner
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}