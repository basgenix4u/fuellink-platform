// src/types/index.ts
// UPDATED: Removed driver role. Added subscription, chat, AI price predictor, media, ads types.

// ─── User Types ──────────────────────────────────────────────────────────────

export type UserRole = "depot" | "marketer" | "admin";

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  subscriptionStatus?: SubscriptionStatus; // marketers only
}

// ─── Subscription (Marketers Only) ───────────────────────────────────────────

export type SubscriptionStatus = "active" | "expired" | "trial" | "none";
export type SubscriptionPlan = "monthly" | "quarterly" | "annual";

export interface Subscription {
  id: string;
  marketerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  amount: number;
  autoRenew: boolean;
}

// ─── Product Types ────────────────────────────────────────────────────────────

export type ProductType = "PMS" | "AGO" | "DPK" | "LPG" | "JET_A1";
export type ProductColor = "clear" | "clear-straw" | "light-amber" | "amber" | "dark";
export type StockLevel = "high" | "medium" | "low" | "out_of_stock";

export interface ProductSpecification {
  color: ProductColor;
  colorCode: string;
  density: number; // kg/m³
  source: string;
  testDate: string;
  sulfurContent?: string;
  flashPoint?: string;
  octaneRating?: string;
}

// ─── Depot Types ──────────────────────────────────────────────────────────────

export interface TankConfig {
  id: string;
  name: string;
  product: ProductType;
  capacity: number; // litres
  currentLevel: number; // litres
}

export interface Depot {
  id: string;
  name: string;
  address: string;
  state: string;
  licenseNumber: string; // NMDPRA license
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  tanks: TankConfig[];
  isVerified: boolean;
  rating: number;
  totalOrders: number;
  // Private price — NOT shown to marketers publicly, only via AI chat
  privatePrices: Record<ProductType, number>;
  createdAt: string;
  subscriptionActive: boolean;
  hasActiveAd?: boolean;
}

// ─── Marketer Types ───────────────────────────────────────────────────────────

export interface Marketer {
  id: string;
  fullName: string;
  businessName: string;
  businessAddress: string;
  state: string;
  rcNumber?: string; // Optional CAC registration
  email: string;
  phone: string;
  subscription: Subscription | null;
  walletBalance: number;
  createdAt: string;
}

// ─── Order Types ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "loading"
  | "loaded"
  | "in_transit"
  | "completed"
  | "cancelled"
  | "disputed";

export interface Order {
  id: string;
  orderNumber: string;
  depotId: string;
  depotName: string;
  marketerId: string;
  marketerName: string;
  product: ProductType;
  quantity: number; // litres
  agreedPricePerLitre: number; // negotiated via chat
  totalAmount: number;
  transactionFee: number; // platform fee (flat % of transaction)
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
  paymentReference?: string;
  paymentMethod: "providus_transfer" | "wallet";
}

// ─── Chat / Messaging ────────────────────────────────────────────────────────

export type MessageType = "text" | "voice" | "file" | "image" | "ai_response";

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: "depot" | "marketer" | "ai";
  senderName: string;
  type: MessageType;
  content: string; // text or transcription of voice
  voiceUrl?: string; // URL to voice note audio
  fileUrl?: string;
  fileName?: string;
  language?: string; // e.g., "ha" for Hausa, "en" for English
  transcription?: string; // AI transcription of voice notes
  createdAt: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  depotId: string;
  depotName: string;
  marketerId: string;
  marketerName: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  // AI chatbot handles initial messages and price inquiries
  aiEnabled: boolean;
}

// ─── AI Price Predictor ───────────────────────────────────────────────────────

export type PriceTrend = "up" | "down" | "stable";

export interface PricePrediction {
  id: string;
  product: ProductType;
  predictedPriceRange: { min: number; max: number };
  currentAvgPrice: number;
  trend: PriceTrend;
  confidence: number; // 0-100
  factors: PriceFactor[];
  generatedAt: string;
  validUntil: string;
}

export interface PriceFactor {
  title: string;
  impact: "positive" | "negative" | "neutral";
  weight: number; // 0-100
  source?: string;
}

// ─── Refinery Types ───────────────────────────────────────────────────────────

export interface Refinery {
  id: string;
  name: string;
  location: string;
  state: string;
  operator: string;
  capacity: number; // barrels per day
  status: "operational" | "partial" | "shutdown" | "maintenance";
  prices: Partial<Record<ProductType, number>>;
  lastUpdated: string;
  isOfficial: boolean; // NNPC / Dangote = true; others may vary
}

// ─── Advertisement ────────────────────────────────────────────────────────────

export type AdPlacement = "homepage_banner" | "marketer_feed" | "email_blast" | "depot_listing_boost";

export interface Advertisement {
  id: string;
  depotId: string;
  depotName: string;
  title: string;
  body: string;
  product: ProductType;
  callToAction: string;
  placement: AdPlacement[];
  budget: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  status: "active" | "paused" | "ended" | "pending_review";
}

// ─── Media Hub ────────────────────────────────────────────────────────────────

export type MediaCategory =
  | "news"
  | "market_analysis"
  | "regulation"
  | "industry"
  | "prices"
  | "technology";

export interface MediaArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: MediaCategory;
  imageUrl?: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  readTimeMinutes: number;
  tags: string[];
  featured: boolean;
}

// ─── Wallet / Payments ────────────────────────────────────────────────────────

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "payment"
  | "refund"
  | "subscription_fee"
  | "transaction_fee"
  | "ad_spend";

export type TransactionStatus = "pending" | "success" | "failed" | "reversed";

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  reference: string;
  orderNumber?: string;
  providusRef?: string; // Providus Bank API reference
  createdAt: string;
}

// ─── NMDPRA Compliance ────────────────────────────────────────────────────────

export interface NMDPRAReport {
  totalLicensedDepots: number;
  activeDepots: number;
  totalTransactionVolume: number; // litres
  transactionValueNGN: number;
  reportPeriod: string;
  stateBreakdown: Array<{
    state: string;
    depotCount: number;
    volumeLitres: number;
  }>;
  complianceIssues: number;
}

// ─── Dispute Types ────────────────────────────────────────────────────────────

export type DisputeStatus = "open" | "under_review" | "resolved" | "escalated";
export type DisputeReason =
  | "quantity_short"
  | "quality_issue"
  | "price_dispute"
  | "delivery_delay"
  | "payment_issue"
  | "other";

export interface Dispute {
  id: string;
  orderNumber: string;
  orderId: string;
  raisedBy: "marketer" | "depot";
  raisedById: string;
  reason: DisputeReason;
  description: string;
  evidence?: string[];
  status: DisputeStatus;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ─── Utility Functions ────────────────────────────────────────────────────────

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case "pending": return "text-amber-600 bg-amber-100";
    case "confirmed": return "text-blue-600 bg-blue-100";
    case "loading": return "text-accent-600 bg-accent-100";
    case "loaded": return "text-primary-600 bg-primary-100";
    case "in_transit": return "text-purple-600 bg-purple-100";
    case "completed": return "text-success-600 bg-success-100";
    case "cancelled": return "text-danger-600 bg-danger-100";
    case "disputed": return "text-orange-600 bg-orange-100";
    default: return "text-slate-600 bg-slate-100";
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

// Platform fee: flat % of transaction value (not per-litre)
export const PLATFORM_FEE_RATE = 0.005; // 0.5% of transaction

export function calculateTransactionFee(totalAmount: number): number {
  return Math.round(totalAmount * PLATFORM_FEE_RATE);
}