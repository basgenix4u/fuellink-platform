// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-NG").format(num);
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} min${mins > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function calculatePriceChange(current: number, previous: number): {
  change: number;
  percentage: number;
  direction: "up" | "down" | "stable";
} {
  const change = current - previous;
  const percentage = previous > 0 ? (change / previous) * 100 : 0;
  const direction = change > 0 ? "up" : change < 0 ? "down" : "stable";

  return { change, percentage, direction };
}

export function getStockLevelColor(level: string): string {
  switch (level) {
    case "high":
      return "text-success-600 bg-success-100";
    case "medium":
      return "text-warning-600 bg-warning-100";
    case "low":
      return "text-danger-600 bg-danger-100";
    case "out_of_stock":
      return "text-slate-600 bg-slate-100";
    default:
      return "text-slate-600 bg-slate-100";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "text-slate-600 bg-slate-100";
    case "confirmed":
      return "text-primary-600 bg-primary-100";
    case "in_transit":
    case "in-transit":
      return "text-warning-600 bg-warning-100";
    case "at_depot":
    case "at-depot":
      return "text-secondary-600 bg-secondary-100";
    case "loading":
      return "text-accent-600 bg-accent-100";
    case "loaded":
      return "text-primary-600 bg-primary-100";
    case "completed":
      return "text-success-600 bg-success-100";
    case "cancelled":
      return "text-danger-600 bg-danger-100";
    case "disputed":
      return "text-purple-600 bg-purple-100";
    default:
      return "text-slate-600 bg-slate-100";
  }
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${random}`;
}

export function generateQRCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "FL-";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const MARKETER_FEE_PER_LITRE = 0.25; // 25 kobo
export const DEPOT_FEE_PER_LITRE = 0.25; // 25 kobo
export const TOTAL_PLATFORM_FEE_PER_LITRE = 0.50; // 50 kobo total

export function calculateOrderFees(quantity: number, pricePerLitre: number) {
  const productCost = quantity * pricePerLitre;
  const marketerFee = quantity * MARKETER_FEE_PER_LITRE;
  const depotFee = quantity * DEPOT_FEE_PER_LITRE;
  const totalPlatformFee = marketerFee + depotFee;
  
  // What marketer pays
  const marketerTotal = productCost + marketerFee;
  
  // What depot receives
  const depotSettlement = productCost - depotFee;
  
  return {
    quantity,
    pricePerLitre,
    productCost,
    marketerFee,
    depotFee,
    totalPlatformFee,
    marketerTotal,
    depotSettlement,
  };
}

// Generate unique QR code for each truck
export function generateTruckQRCode(orderId: string, truckNumber: number): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FUELLINK-${orderId}-T${truckNumber}-${timestamp}${random}`;
}