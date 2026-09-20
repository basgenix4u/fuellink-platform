// src/lib/mock-data/index.ts

export * from "./depots";
export * from "./refineries";

// Platform Statistics (for landing page and dashboards)
export const platformStats = {
  totalTransactionValue: 58500000000, // ₦58.5 Billion
  activeDepots: 127,
  registeredMarketers: 3456,
  completedOrders: 28934,
  averageSavings: 15, // percentage
  uptime: 99.9,
  supportedStates: 12,
};

// Product type labels
export const productTypeLabels: Record<string, string> = {
  PMS: "Premium Motor Spirit (Petrol)",
  AGO: "Automotive Gas Oil (Diesel)",
  DPK: "Dual Purpose Kerosene",
  LPG: "Liquefied Petroleum Gas",
  JET_A1: "Aviation Fuel (Jet A1)",
};

// Product type short labels
export const productTypeShortLabels: Record<string, string> = {
  PMS: "Petrol",
  AGO: "Diesel",
  DPK: "Kerosene",
  LPG: "Cooking Gas",
  JET_A1: "Jet Fuel",
};

// Nigerian States
export const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];