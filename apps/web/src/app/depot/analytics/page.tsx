// src/app/depot/analytics/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber, formatCompactNumber } from "@/lib/utils";

const revenueData = [
  { date: "Mon", revenue: 45000000, orders: 18 },
  { date: "Tue", revenue: 52000000, orders: 22 },
  { date: "Wed", revenue: 48000000, orders: 20 },
  { date: "Thu", revenue: 61000000, orders: 25 },
  { date: "Fri", revenue: 55000000, orders: 23 },
  { date: "Sat", revenue: 42000000, orders: 17 },
  { date: "Sun", revenue: 38000000, orders: 15 },
];

const productData = [
  { name: "AGO", value: 65, color: "#0D5C2F" },
  { name: "PMS", value: 25, color: "#FF8C00" },
  { name: "DPK", value: 8, color: "#FFD700" },
  { name: "LPG", value: 2, color: "#94A3B8" },
];

const volumeData = [
  { month: "Jan", volume: 12500000 },
  { month: "Feb", volume: 14200000 },
  { month: "Mar", volume: 13800000 },
  { month: "Apr", volume: 15600000 },
  { month: "May", volume: 16200000 },
  { month: "Jun", volume: 18500000 },
];

const topCustomers = [
  { name: "Sahara Energy Resources", orders: 47, volume: 1550000, revenue: 1782500000 },
  { name: "Matrix Petroleum Ltd", orders: 38, volume: 1254000, revenue: 1442100000 },
  { name: "Golden Oil Company", orders: 32, volume: 1056000, revenue: 1214400000 },
  { name: "Premier Fuel Distributors", orders: 28, volume: 924000, revenue: 1062600000 },
  { name: "National Oil Marketers", orders: 25, volume: 825000, revenue: 948750000 },
];

const stats = [
  {
    label: "Total Revenue",
    value: 341000000,
    change: 12.5,
    trend: "up",
    icon: DollarSign,
    format: "currency",
  },
  {
    label: "Total Volume",
    value: 5800000,
    suffix: "L",
    change: 8.3,
    trend: "up",
    icon: Package,
    format: "volume",
  },
  {
    label: "Total Orders",
    value: 140,
    change: 15.2,
    trend: "up",
    icon: ShoppingCart,
    format: "number",
  },
  {
    label: "Active Customers",
    value: 67,
    change: -2.4,
    trend: "down",
    icon: Users,
    format: "number",
  },
];

const timeRanges = ["Today", "This Week", "This Month", "This Year"];

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState("This Week");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500">
            Track your depot performance and insights
          </p>
        </div>
        <div className="flex gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedRange === range
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <Button variant="outline" size="md">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
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
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary-500" />
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
                  stat.trend === "up"
                    ? "text-success-700 bg-success-50"
                    : "text-danger-700 bg-danger-50"
                )}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">
              {stat.format === "currency"
                ? formatCurrency(stat.value)
                : stat.format === "volume"
                ? `${formatCompactNumber(stat.value)}${stat.suffix || ""}`
                : formatNumber(stat.value)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Revenue Overview
              </h2>
              <p className="text-sm text-slate-500">Daily revenue this week</p>
            </div>
            <Badge variant="success" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </Badge>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D5C2F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0D5C2F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickFormatter={(value) => `₦${formatCompactNumber(value)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "none",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                  }}
                  formatter={(value: number | undefined) => [
                    value === undefined ? "—" : formatCurrency(value),
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0D5C2F"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Product Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Product Distribution
          </h2>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "none",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                  }}
                  formatter={(value: number | undefined) => [
                    value === undefined ? "—" : `${value}%`,
                    "Share",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {productData.map((product) => (
              <div key={product.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: product.color }}
                />
                <span className="text-sm text-slate-600">{product.name}</span>
                <span className="text-sm font-medium text-slate-900 ml-auto">
                  {product.value}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Volume Trend & Top Customers */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Volume Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Volume Trend
              </h2>
              <p className="text-sm text-slate-500">Monthly volume (litres)</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickFormatter={(value) => `${formatCompactNumber(value)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "none",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                  }}
                  formatter={(value: number | undefined) => [
                    value === undefined ? "—" : `${formatNumber(value)}L`,
                    "Volume",
                  ]}
                />
                <Bar
                  dataKey="volume"
                  fill="#FF8C00"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              Top Customers
            </h2>
            <p className="text-sm text-slate-500">By transaction volume</p>
          </div>

          <div className="divide-y divide-slate-100">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.name}
                className="p-4 flex items-center gap-4 hover:bg-slate-50"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {customer.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {customer.orders} orders • {formatCompactNumber(customer.volume)}L
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(customer.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white"
      >
        <h2 className="text-xl font-bold mb-6">Performance Metrics</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-white/70 text-sm mb-1">Avg. Loading Time</p>
            <p className="text-3xl font-bold">38 min</p>
            <p className="text-sm text-green-300 flex items-center gap-1 mt-1">
              <TrendingDown className="w-4 h-4" />
              5% faster
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-white/70 text-sm mb-1">Order Completion Rate</p>
            <p className="text-3xl font-bold">96.8%</p>
            <p className="text-sm text-green-300 flex items-center gap-1 mt-1">
              <TrendingUp className="w-4 h-4" />
              2.3% up
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-white/70 text-sm mb-1">Customer Satisfaction</p>
            <p className="text-3xl font-bold">4.8/5</p>
            <p className="text-sm text-green-300 flex items-center gap-1 mt-1">
              <TrendingUp className="w-4 h-4" />
              Based on 342 reviews
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-white/70 text-sm mb-1">Repeat Customers</p>
            <p className="text-3xl font-bold">78%</p>
            <p className="text-sm text-green-300 flex items-center gap-1 mt-1">
              <TrendingUp className="w-4 h-4" />
              High loyalty
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}