"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { ChartSkeleton } from "./ChartSkeleton";

const LazyLine = dynamic(() => import("./charts").then((m) => m.LineChartBox), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

const LazyBarLine = dynamic(() => import("./charts").then((m) => m.BarLineBox), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

const LazyRangeBand = dynamic(() => import("./charts").then((m) => m.RangeBandBox), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

const LazyGantry = dynamic(() => import("./GantryChart").then((m) => m.GantryChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export function LineChartBox(props: ComponentProps<typeof LazyLine>) {
  return (
    <div style={{ height: props.height ?? 280 }}>
      <LazyLine {...props} />
    </div>
  );
}

export function BarLineBox(props: ComponentProps<typeof LazyBarLine>) {
  return (
    <div style={{ height: props.height ?? 300 }}>
      <LazyBarLine {...props} />
    </div>
  );
}

export function RangeBandBox(props: ComponentProps<typeof LazyRangeBand>) {
  return (
    <div style={{ height: props.height ?? 280 }}>
      <LazyRangeBand {...props} />
    </div>
  );
}

export function GantryChart(props: ComponentProps<typeof LazyGantry>) {
  return (
    <div className="w-full" style={{ height: 320 }}>
      <LazyGantry {...props} />
    </div>
  );
}
