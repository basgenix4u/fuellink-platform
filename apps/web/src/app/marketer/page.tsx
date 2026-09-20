// src/app/marketer/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  Truck,
  Bell,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
  CheckCircle2,
  Star,
  MapPin,
  Fuel,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils";

const stats = [
  {
    label: "Wallet Balance",
    value: 45500000,
    change: null,
    icon: Wallet,
    color: "primary",
    format: "currency",
  },
  {
    label: "Active Orders",
    value: 3,
    change: null,
    icon: ShoppingCart,
    color: "secondary",
    format: "number",
  },
  {
    label: "Total Spent (Month)",
    value: 285000000,
    change: 12.5,
    trend: "up",
    icon: TrendingUp,
    color: "accent",
    format: "currency",
  },
  {
    label: "Volume Purchased",
    value: 297000,
    suffix: "L",
    change: 8.3,
    trend: "up",
    icon: Fuel,
    color: "success",
    format: "number",
  },
];

const livePrices = [
  {
    depot: "Pinnacle Oil & Gas",
    location: "Apapa, Lagos",
    product: "AGO",
    price: 1150,
    change: 5,
    stock: "high",
    rating: 4.8,
  },
  {
    depot: "Matrix Energy Depot",
    location: "Apapa, Lagos",
    product: "AGO",
    price: 1145,
    change: -5,
    stock: "high",
    rating: 4.6,
  },
  {
    depot: "Sahara Energy Terminal",
    location: "Iganmu, Lagos",
    product: "AGO",
    price: 1148,
    change: 8,
    stock: "high",
    rating: 4.9,
  },
  {
    depot: "Oando Supply Terminal",
    location: "Apapa, Lagos",
    product: "PMS",
    price: 892,
    change: -3,
    stock: "medium",
    rating: 4.5,
  },
];

const activeOrders = [
  {
    id: "ORD-2025-001234",
    depot: "Pinnacle Oil & Gas",
    product: "AGO",
    quantity: 33000,
    amount: 37950000,
    status: "loading",
    eta: "Loading now",
  },
  {
    id: "ORD-2025-001235",
    depot: "Matrix Energy Depot",
    product: "PMS",
    quantity: 45000,
    amount: 40050000,
    status: "in-transit",
    eta: "Arriving in 2 hours",
  },
  {
    id: "ORD-2025-001236",
    depot: "Sahara Energy Terminal",
    product: "AGO",
    quantity: 33000,
    amount: 37884000,
    status: "confirmed",
    eta: "Pickup tomorrow",
  },
];

const priceAlerts = [
  { product: "AGO", targetPrice: 1100, currentPrice: 1145, triggered: false },
  { product: "PMS", targetPrice: 850, currentPrice: 890, triggered: false },
];

const refineryPrices = [
  { name: "Dangote Refinery", ago: 1120, pms: 860, status: "active" },
  { name: "Port Harcourt Refinery", ago: 1125, pms: 865, status: "active" },
  { name: "Warri Refinery", ago: 1130, pms: null, status: "limited" },
];

export default function MarketerDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Welcome back! Here&apos;s the latest market overview.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/marketer/prices">
            <Button variant="outline" size="md">
              <TrendingUp className="w-4 h-4 mr-2" />
              View All Prices
            </Button>
          </Link>
          <Link href="/marketer/depots">
            <Button variant="secondary" size="md">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Place Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                stat.color === "primary" && "bg-primary-50 text-primary-500",
                stat.color === "secondary" && "bg-secondary-50 text-secondary-500",
                stat.color === "accent" && "bg-accent-50 text-accent-600",
                stat.color === "success" && "bg-success-50 text-success-500"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.change && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
                  stat.trend === "up" ? "text-success-700 bg-success-50" : "text-danger-700 bg-danger-50"
                )}>
                  {stat.trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">
              {stat.format === "currency" 
                ? formatCurrency(stat.value) 
                : `${formatNumber(stat.value)}${stat.suffix || ""}`}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Prices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h2 className="text-lg font-semibold text-slate-900">Live Depot Prices</h2>
            </div>
            <Link href="/marketer/prices" className="text-sm font-medium text-secondary-600 hover:text-secondary-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {livePrices.map((item, index) => (
              <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{item.depot}</h3>
                        <Badge variant="primary">{item.product}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {item.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">₦{formatNumber(item.price)}</p>
                    <div className={cn(
                      "flex items-center justify-end gap-1 text-sm",
                      item.change > 0 ? "text-success-600" : item.change < 0 ? "text-danger-600" : "text-slate-500"
                    )}>
                      {item.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {item.change > 0 ? "+" : ""}₦{item.change}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Refinery Prices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Refinery Prices</h2>
            <p className="text-sm text-slate-500">Ex-works prices</p>
          </div>

          <div className="p-4 space-y-4">
            {refineryPrices.map((refinery, index) => (
              <div key={index} className="p-4 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{refinery.name}</h3>
                  <Badge variant={refinery.status === "active" ? "success" : "warning"}>
                    {refinery.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">AGO</p>
                    <p className="font-bold text-slate-900">₦{formatNumber(refinery.ago)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">PMS</p>
                    <p className="font-bold text-slate-900">
                      {refinery.pms ? `₦${formatNumber(refinery.pms)}` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <Link href="/marketer/refineries">
              <Button variant="outline" size="md" className="w-full">
                View All Refineries
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Active Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Active Orders</h2>
          <Link href="/marketer/orders" className="text-sm font-medium text-secondary-600">
            View All Orders
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {activeOrders.map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  order.status === "loading" && "bg-secondary-100 text-secondary-600",
                  order.status === "in-transit" && "bg-warning-100 text-warning-600",
                  order.status === "confirmed" && "bg-primary-100 text-primary-600"
                )}>
                  {order.status === "loading" && <Package className="w-6 h-6" />}
                  {order.status === "in-transit" && <Truck className="w-6 h-6" />}
                  {order.status === "confirmed" && <CheckCircle2 className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{order.id}</h3>
                    <Badge variant="primary">{order.product}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {order.depot} • {formatNumber(order.quantity)}L
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatCurrency(order.amount)}</p>
                <p className="text-sm text-slate-500 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" />
                  {order.eta}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions & Alerts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Price Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Price Alerts</h2>
            <Link href="/marketer/alerts" className="text-sm font-medium text-secondary-600">
              Manage
            </Link>
          </div>

          <div className="space-y-4">
            {priceAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">{alert.product} ≤ ₦{formatNumber(alert.targetPrice)}</p>
                    <p className="text-sm text-slate-500">Current: ₦{formatNumber(alert.currentPrice)}</p>
                  </div>
                </div>
                <Badge variant={alert.triggered ? "success" : "warning"}>
                  {alert.triggered ? "Triggered" : "Watching"}
                </Badge>
              </div>
            ))}

            <Button variant="outline" size="md" className="w-full">
              <Bell className="w-4 h-4 mr-2" />
              Create New Alert
            </Button>
          </div>
        </motion.div>

        {/* Quick Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl p-6 text-white"
        >
          <h2 className="text-lg font-semibold mb-4">Quick Profit Calculator</h2>
          <p className="text-white/80 mb-6">
            Calculate your potential profit margin before placing an order.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/70 text-sm">Depot Price</p>
                <p className="text-2xl font-bold">₦1,150</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Your Pump Price</p>
                <p className="text-2xl font-bold">₦1,250</p>
              </div>
            </div>
            <div className="border-t border-white/20 mt-4 pt-4">
              <p className="text-white/70 text-sm">Potential Margin (33,000L)</p>
              <p className="text-3xl font-bold text-green-300">₦3,300,000</p>
            </div>
          </div>

          <Link href="/marketer/calculator">
            <Button variant="white" size="md" className="w-full">
              Open Full Calculator
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}