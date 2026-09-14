// src/lib/mock-data/refineries.ts
// All operating and major Nigerian refineries with real data

import { Refinery } from "@/types";

export const mockRefineries: Refinery[] = [
  {
    id: "ref-001",
    name: "Dangote Petroleum Refinery",
    location: "Ibeju-Lekki, Lagos",
    state: "Lagos",
    operator: "Dangote Industries Limited",
    capacity: 650000, // bpd - largest single-train refinery in the world
    status: "operational",
    prices: {
      PMS: 897,
      AGO: 1150,
      JET_A1: 1320,
      LPG: 1050,
    },
    lastUpdated: new Date().toISOString(),
    isOfficial: true,
  },
  {
    id: "ref-002",
    name: "Port Harcourt Refinery (Old)",
    location: "Alesa-Eleme, Rivers",
    state: "Rivers",
    operator: "Nigerian National Petroleum Company Ltd (NNPCL)",
    capacity: 60000, // bpd
    status: "partial",
    prices: {
      PMS: 897,
      AGO: 1140,
      DPK: 980,
    },
    lastUpdated: new Date().toISOString(),
    isOfficial: true,
  },
  {
    id: "ref-003",
    name: "Port Harcourt Refinery (New)",
    location: "Alesa-Eleme, Rivers",
    state: "Rivers",
    operator: "Nigerian National Petroleum Company Ltd (NNPCL)",
    capacity: 150000, // bpd
    status: "maintenance",
    prices: {},
    lastUpdated: new Date().toISOString(),
    isOfficial: true,
  },
  {
    id: "ref-004",
    name: "Warri Refinery & Petrochemical Company",
    location: "Ekpan, Delta",
    state: "Delta",
    operator: "Nigerian National Petroleum Company Ltd (NNPCL)",
    capacity: 125000, // bpd
    status: "maintenance",
    prices: {},
    lastUpdated: new Date().toISOString(),
    isOfficial: true,
  },
  {
    id: "ref-005",
    name: "Kaduna Refinery & Petrochemical Company",
    location: "Kaduna",
    state: "Kaduna",
    operator: "Nigerian National Petroleum Company Ltd (NNPCL)",
    capacity: 110000, // bpd
    status: "shutdown",
    prices: {},
    lastUpdated: new Date().toISOString(),
    isOfficial: true,
  },
  {
    id: "ref-006",
    name: "Niger Delta Petroleum Resources (NDPR) Refinery",
    location: "Ogbele, Rivers",
    state: "Rivers",
    operator: "Niger Delta Petroleum Resources",
    capacity: 11000, // bpd
    status: "operational",
    prices: {
      AGO: 1130,
      DPK: 970,
    },
    lastUpdated: new Date().toISOString(),
    isOfficial: false,
  },
  {
    id: "ref-007",
    name: "Walter Smith Refinery",
    location: "Ibigwe, Imo",
    state: "Imo",
    operator: "Walter Smith Petroman Oil Limited",
    capacity: 5000, // bpd
    status: "operational",
    prices: {
      AGO: 1125,
    },
    lastUpdated: new Date().toISOString(),
    isOfficial: false,
  },
  {
    id: "ref-008",
    name: "Edo Refinery & Petrochemical Company",
    location: "Ologbo, Edo",
    state: "Edo",
    operator: "Edo Refinery & Petrochemical Company",
    capacity: 30000, // bpd — under construction
    status: "maintenance",
    prices: {},
    lastUpdated: new Date().toISOString(),
    isOfficial: false,
  },
  {
    id: "ref-009",
    name: "BUA Refinery",
    location: "Akwa Ibom",
    state: "Akwa Ibom",
    operator: "BUA Group",
    capacity: 200000, // bpd — planned/under development
    status: "shutdown",
    prices: {},
    lastUpdated: new Date().toISOString(),
    isOfficial: false,
  },
  {
    id: "ref-010",
    name: "NNPCL Satellite Depot — Apapa",
    location: "Apapa, Lagos",
    state: "Lagos",
    operator: "Nigerian National Petroleum Company Ltd (NNPCL)",
    capacity: 0,
    status: "operational",
    prices: {
      PMS: 897,
      AGO: 1145,
      DPK: 975,
      LPG: 1040,
    },
    lastUpdated: new Date().toISOString(),
    isOfficial: true,
  },
];

// Helper: get all operational refineries
export function getOperationalRefineries(): Refinery[] {
  return mockRefineries.filter((r) => r.status === "operational");
}

// Helper: get refineries with a specific product
export function getRefineryByProduct(product: string): Refinery[] {
  return mockRefineries.filter(
    (r) => r.status === "operational" && product in r.prices
  );
}

// Helper: get average market price for a product across operational refineries
export function getMarketAveragePrice(product: string): number | null {
  const refineries = getRefineryByProduct(product);
  if (!refineries.length) return null;
  const prices = refineries
    .map((r) => r.prices[product as keyof typeof r.prices])
    .filter((p): p is number => p !== undefined);
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}