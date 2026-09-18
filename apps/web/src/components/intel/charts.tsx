"use client";

// FuelLink Intelligence — recharts wrappers.

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Bar,
  Area,
  ReferenceLine,
} from "recharts";

export interface Series {
  key: string;
  name: string;
  color: string;
  dashed?: boolean;
}

const AXIS = { fontSize: 11, fill: "#64748B" };
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
  fontSize: 12,
};

export function LineChartBox({
  data,
  xKey,
  series,
  height = 280,
  unit,
  domain,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  unit?: string;
  domain?: [number | string, number | string];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: "#CBD5E1" }} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={48}
          domain={domain as [number, number] | undefined}
          tickFormatter={(v: number) => (unit ? `${v}${unit}` : String(v))}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number | string | undefined, name: string | undefined) => [
            value == null ? "not reported" : `${value}${unit ?? ""}`,
            name ?? "",
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 4" : undefined}
            dot={{ r: 3, strokeWidth: 0, fill: s.color }}
            connectNulls
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarLineBox({
  data,
  xKey,
  bars,
  lines = [],
  height = 300,
  unit,
  yDomain,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  bars: Series[];
  lines?: Series[];
  height?: number;
  unit?: string;
  yDomain?: [number | string, number | string];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: "#CBD5E1" }} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={48}
          domain={yDomain as [number, number] | undefined}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number | string | undefined, name: string | undefined) => [
            value == null ? "not reported" : `${value}${unit ?? ""}`,
            name ?? "",
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {bars.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={34} />
        ))}
        {lines.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 4" : undefined}
            dot={{ r: 3, strokeWidth: 0, fill: s.color }}
            connectNulls
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Min–max band with a midline (e.g. LPG national retail range). */
export function RangeBandBox({
  data,
  xKey,
  lowKey,
  highKey,
  midKey,
  height = 280,
  unit = "₦",
  color = "#FF8C00",
}: {
  data: Record<string, unknown>[];
  xKey: string;
  lowKey: string;
  highKey: string;
  midKey?: string;
  height?: number;
  unit?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: "#CBD5E1" }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number | string | undefined, name: string | undefined) => [
            value == null ? "not reported" : `${unit}${value}`,
            name ?? "",
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          dataKey={highKey}
          name={`${unit}/kg max`}
          stroke={color}
          strokeDasharray="4 4"
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.12}
          connectNulls
        />
        <Area
          dataKey={lowKey}
          name={`${unit}/kg min`}
          stroke={color}
          strokeDasharray="4 4"
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.12}
          connectNulls
        />
        {midKey && (
          <Line
            type="monotone"
            dataKey={midKey}
            name="mid"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: color }}
            connectNulls
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ReferenceLineBox({
  data,
  xKey,
  series,
  reference,
  height = 280,
  unit,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  reference: { y: number; label: string };
  height?: number;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: "#CBD5E1" }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number | string | undefined, name: string | undefined) => [
            value == null ? "not reported" : `${value}${unit ?? ""}`,
            name ?? "",
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
        <ReferenceLine
          y={reference.y}
          stroke="#0D5C2F"
          strokeDasharray="6 4"
          label={{ value: reference.label, position: "insideTopRight", fontSize: 11, fill: "#0D5C2F" }}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: s.color }}
            connectNulls
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
