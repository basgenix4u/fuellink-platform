"use client";

// Gantry price-ladder chart: dated indicative/NNPC points on a timeline,
// DPRP ex-gantry range shown as a horizontal band.

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

export interface GantryChartRow {
  x: string;
  lagos?: number | null;
  abuja?: number | null;
  nnpc?: number | null;
}

export function GantryChart({ data, bandLow, bandHigh }: {
  data: GantryChartRow[];
  bandLow: number;
  bandHigh: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="x" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#CBD5E1" }} />
        <YAxis
          domain={[800, 1450]}
          tick={{ fontSize: 11, fill: "#64748B" }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => `₦${v}`}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
          formatter={(value: number | string | undefined, name: string | undefined) => [
            value == null ? "not reported" : `₦${value}`,
            name ?? "",
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceArea
          y1={bandLow}
          y2={bandHigh}
          fill="#FF8C00"
          fillOpacity={0.08}
          stroke="#FF8C00"
          strokeOpacity={0.4}
          strokeDasharray="4 4"
          label={{ value: "DPRP ex-gantry range (2026)", position: "insideBottomLeft", fontSize: 11, fill: "#CC6D00" }}
        />
        <ReferenceLine y={bandLow} stroke="#FF8C00" strokeDasharray="4 4" strokeOpacity={0.5} />
        <ReferenceLine y={bandHigh} stroke="#FF8C00" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Line
          type="monotone"
          dataKey="lagos"
          name="Indicative — Lagos (₦/L)"
          stroke="#0D5C2F"
          strokeWidth={2.5}
          dot={{ r: 4, strokeWidth: 0, fill: "#0D5C2F" }}
          connectNulls
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="abuja"
          name="Indicative — Abuja (₦/L)"
          stroke="#FF8C00"
          strokeWidth={2.5}
          dot={{ r: 4, strokeWidth: 0, fill: "#FF8C00" }}
          connectNulls
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="nnpc"
          name="NNPC revision (₦/L)"
          stroke="#475569"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={{ r: 4, strokeWidth: 0, fill: "#475569" }}
          connectNulls
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
