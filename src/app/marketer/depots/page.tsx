// src/app/marketer/depots/page.tsx
// UPDATED: No prices shown — marketers contact depot via chat for pricing
// Added: depot logos, stock levels, map link, chat CTA
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Shield,
  SlidersHorizontal,
  MessageSquare,
  Package,
  Clock,
  CheckCircle2,
  Grid,
  List,
  Bot,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { DepotLogo } from "@/components/shared/DepotLogo";
import { cn } from "@/lib/utils";
import { mockDepots, stockLevelConfig, type MockDepot } from "@/lib/mock-data/depots";

const states = ["All States", "Lagos", "Rivers", "Delta", "Ogun", "Edo"];

function ProductBadge({ type, stockLevel }: { type: string; stockLevel: string }) {
  const cfg = stockLevelConfig[stockLevel as keyof typeof stockLevelConfig] ?? stockLevelConfig.medium;
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg", cfg.bg)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      <span className={cn("text-xs font-bold", cfg.color)}>{type}</span>
    </div>
  );
}

function DepotCard({ depot, viewMode }: { depot: MockDepot; viewMode: "grid" | "list" }) {
  const isList = viewMode === "list";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group",
        isList && "flex"
      )}
    >
      {/* Logo banner */}
      <div
        className={cn(
          "flex items-center justify-center relative overflow-hidden",
          isList ? "w-32 flex-shrink-0" : "h-36"
        )}
        style={{
          background: `linear-gradient(135deg, ${depot.logoColor}12 0%, ${depot.logoColor}28 100%)`,
        }}
      >
        {/* Tank silhouette background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          viewBox="0 0 200 100"
          preserveAspectRatio="xMidYMid slice"
          fill={depot.logoColor}
        >
          <ellipse cx="60" cy="20" rx="45" ry="16" />
          <rect x="15" y="20" width="90" height="55" />
          <ellipse cx="60" cy="75" rx="45" ry="16" />
          <rect x="52" y="4" width="16" height="20" rx="3" />
          <ellipse cx="150" cy="35" rx="35" ry="12" />
          <rect x="115" y="35" width="70" height="42" />
          <ellipse cx="150" cy="77" rx="35" ry="12" />
          <rect x="0" y="90" width="200" height="4" rx="2" />
        </svg>

        <DepotLogo
          name={depot.name}
          initials={depot.logoInitials}
          color={depot.logoColor}
          size={isList ? "md" : "lg"}
          showTankIcon={false}
        />

        {/* Verified badge */}
        {depot.isVerified && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-green-600" />
            <span className="text-[10px] font-bold text-green-700">NMDPRA</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn("p-4", isList && "flex-1")}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">
              {depot.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{depot.lga}, {depot.state}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-slate-900">{depot.rating}</span>
            <span className="text-xs text-slate-400">({depot.reviewCount})</span>
          </div>
        </div>

        {/* Products available — NO prices */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {depot.products.map((p) => (
            <ProductBadge key={p.id} type={p.type} stockLevel={p.stockLevel} />
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {depot.operatingHours}
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            {depot.stats.onTimeRate}% on-time
          </span>
        </div>

        {/* Price notice */}
        <div className="flex items-center gap-1.5 bg-primary-50 rounded-xl px-2.5 py-1.5 mb-3">
          <Bot className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <p className="text-[11px] text-primary-700 font-medium">
            Chat depot for pricing & availability
          </p>
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <Link href={`/marketer/depots/${depot.id}`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth>
              View Depot
            </Button>
          </Link>
          <Link href={`/marketer/chat?depot=${depot.id}`} className="flex-1">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            >
              Chat
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function DepotsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedProduct, setSelectedProduct] = useState("All Products");

  const filteredDepots = mockDepots.filter((depot) => {
    const matchesSearch =
      depot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      depot.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedState === "All States" || depot.state === selectedState;
    const matchesProduct =
      selectedProduct === "All Products" ||
      depot.products.some((p) => p.type === selectedProduct);
    return matchesSearch && matchesState && matchesProduct;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse Depots</h1>
          <p className="text-slate-500 text-sm">
            {filteredDepots.length} verified depots across Nigeria •{" "}
            <span className="text-primary-600 font-medium">Chat any depot for pricing</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-xl transition-colors",
              viewMode === "grid" ? "bg-primary-100 text-primary-700" : "text-slate-400 hover:bg-slate-100"
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-xl transition-colors",
              viewMode === "list" ? "bg-primary-100 text-primary-700" : "text-slate-400 hover:bg-slate-100"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pricing notice banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
        <Bot className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Prices are private.</strong> Each depot's AI chatbot will share pricing when you start a chat.
          This enables fair negotiation and keeps prices competitive.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search depots, locations..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 bg-white"
          />
        </div>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 bg-white text-sm"
        >
          {states.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 bg-white text-sm"
        >
          {["All Products", "PMS", "AGO", "DPK", "LPG", "JET_A1"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      <div
        className={cn(
          "gap-5",
          viewMode === "grid"
            ? "grid sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col"
        )}
      >
        {filteredDepots.map((depot) => (
          <DepotCard key={depot.id} depot={depot} viewMode={viewMode} />
        ))}
      </div>

      {filteredDepots.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600">No depots found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
