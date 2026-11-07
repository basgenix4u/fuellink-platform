"use client";

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
} from "recharts";
import { formatCompactNumber, formatCurrency, formatNumber } from "@/lib/utils";

const revenueData = [
  { date: "Mon", revenue: 45000000, orders: 18 },
  { date: "Tue", revenue: 52000000, orders: 22 },
  { date: "Wed", revenue: 48000000, orders: 20 },
  { date: "Thu", revenue: 61000000, orders: 25 },
  { date: "Fri", revenue: 55000000, orders: 23 },
  { date: "Sat", revenue: 42000000, orders: 17 },
  { date: "Sun", revenue: 38000000, orders: 15 },
];

const volumeData = [
  { month: "Jan", volume: 12500000 },
  { month: "Feb", volume: 14200000 },
  { month: "Mar", volume: 13800000 },
  { month: "Apr", volume: 15600000 },
  { month: "May", volume: 16200000 },
  { month: "Jun", volume: 18500000 },
];

const tooltipStyle = {
  backgroundColor: "#1E293B",
  border: "none",
  borderRadius: "12px",
  color: "#F8FAFC",
};

export function RevenueChart() {
  return (
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
          contentStyle={tooltipStyle}
          formatter={(value: number | undefined) => [
            value === undefined ? "—" : formatCurrency(value),
            "Revenue",
          ]}
        />
        <Area isAnimationActive={false}
          type="monotone"
          dataKey="revenue"
          stroke="#0D5C2F"
          strokeWidth={3}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProductPieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie isAnimationActive={false}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number | undefined) => [
            value === undefined ? "—" : `${value}%`,
            "Share",
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function VolumeChart() {
  return (
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
          contentStyle={tooltipStyle}
          formatter={(value: number | undefined) => [
            value === undefined ? "—" : `${formatNumber(value)}L`,
            "Volume",
          ]}
        />
        <Bar isAnimationActive={false} dataKey="volume" fill="#FF8C00" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
