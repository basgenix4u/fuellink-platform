// Sitemap — static routes + generated monthly reports.
//
// SITE URL is env-overridable (NEXT_PUBLIC_SITE_URL) so the same build works
// on the preview domain and production.

import type { MetadataRoute } from "next";
import { readdirSync } from "node:fs";
import path from "node:path";

// Static export requires an explicit static directive on metadata routes.
export const dynamic = "force-static";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fuellink.ng";

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/intel", priority: 0.9 },
  { path: "/reports", priority: 0.8 },
  { path: "/intel/gantry", priority: 0.8 },
  { path: "/intel/sufficiency", priority: 0.8 },
  { path: "/intel/lome", priority: 0.8 },
  { path: "/intel/prices", priority: 0.8 },
  { path: "/intel/calculator", priority: 0.7 },
  { path: "/intel/arbitrage", priority: 0.7 },
  { path: "/intel/lpg", priority: 0.7 },
  { path: "/intel/jet", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  let reportMonths: string[] = [];
  try {
    reportMonths = readdirSync(path.join(process.cwd(), "src/data/reports"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch {
    // reports dir absent in some environments — static routes still emit
  }
  const now = new Date();
  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${SITE}${r.path}`,
      lastModified: now,
      changeFrequency: (r.path.startsWith("/intel") ? "weekly" : "daily") as "weekly" | "daily",
      priority: r.priority,
    })),
    ...reportMonths.map((m) => ({
      url: `${SITE}/reports/${m}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
