"use client";

import { useState } from "react";
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
import dynamic from "next/dynamic";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber, formatCompactNumber } from "@/lib/utils";

const RevenueChart = dynamic(() => import("./charts").then((m) => m.RevenueChart), {
  ssr: false,
  loading: () => <ChartPlaceholder />,
});

const ProductPieChart = dynamic(() => import("./charts").then((m) => m.ProductPieChart), {
  ssr: false,
  loading: () => <ChartPlaceholder />,
});

const VolumeChart = dynamic(() => import("./charts").then((m) => m.VolumeChart), {
  ssr: false,
  loading: () => <ChartPlaceholder />,
});

function ChartPlaceholder() {
  return <div className="h-full w-full rounded-lg bg-slate-900/[0.035]" aria-hidden />;
}

const productData = [
  { name: "AGO", value: 65, color: "#0D5C2F" },
  { name: "PMS", value: 25, color: "#FF8C00" },
  { name: "DPK", value: 8, color: "#FFD700" },
  { name: "LPG", value: 2, color: "#94A3B8" },
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
          <h1 className="t-h2 text-slate-900">Analytics</h1>
          <p className="text-slate-500">
            Track your depot performance and insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="scroll-thin -mx-1 flex max-w-full overflow-x-auto bg-slate-100 rounded-xl p-1">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={cn(
                  "shrink-0 whitespace-nowrap px-3 py-2 rounded-lg text-[13px] font-medium transition-colors sm:px-4 sm:text-sm",
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
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
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
            <p className="stat-value text-slate-900">
              {stat.format === "currency"
                ? formatCurrency(stat.value)
                : stat.format === "volume"
                ? `${formatCompactNumber(stat.value)}${stat.suffix || ""}`
                : formatNumber(stat.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
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
            <RevenueChart />
          </div>
        </div>

        {/* Product Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Product Distribution
          </h2>

          <div className="h-48">
            <ProductPieChart data={productData} />
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
        </div>
      </div>

      {/* Volume Trend & Top Customers */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Volume Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Volume Trend
              </h2>
              <p className="text-sm text-slate-500">Monthly volume (litres)</p>
            </div>
          </div>

          <div className="h-64">
            <VolumeChart />
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-900 sm:text-sm">
                    {customer.name}
                  </p>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    {customer.orders} orders · {formatCompactNumber(customer.volume)}L
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-semibold text-slate-900 sm:text-sm">
                    {formatCurrency(customer.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
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
      </div>
    </div>
  );
}