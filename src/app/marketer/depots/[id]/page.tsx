// src/app/marketer/depots/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Shield,
  Package,
  MessageSquare,
  CheckCircle2,
  Bot,
  Info,
  ChevronRight,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { DepotProfileBanner, DepotLogo } from "@/components/shared/DepotLogo";
import { DepotMap } from "@/components/shared/DepotMap";
import { cn } from "@/lib/utils";
import { mockDepots, stockLevelConfig } from "@/lib/mock-data/depots";

const MOCK_REVIEWS = [
  { author: "Adamu Petroleum Ltd", rating: 5, comment: "Very reliable. AI chat answered all my questions within minutes. Loading was smooth.", date: "2025-02-16" },
  { author: "ChiOil Distributors", rating: 5, comment: "Best depot in Apapa. Always on time. Their chatbot is impressive — speaks Yoruba too!", date: "2025-02-10" },
  { author: "Emeka Fuels", rating: 4, comment: "Good service overall. Slight delay once but they communicated well through the chat.", date: "2025-01-28" },
];

export default function DepotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "map" | "reviews">("overview");

  const depot = mockDepots.find((d) => d.id === params.id) ?? mockDepots[0];

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "products" as const, label: "Products" },
    { id: "map" as const, label: "Location & Map" },
    { id: "reviews" as const, label: `Reviews (${MOCK_REVIEWS.length})` },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Depots
      </button>

      {/* Profile banner with depot logo/color */}
      <DepotProfileBanner
        name={depot.name}
        initials={depot.logoInitials}
        color={depot.logoColor}
      />

      {/* Depot header info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-start gap-4">
          <DepotLogo
            name={depot.name}
            initials={depot.logoInitials}
            color={depot.logoColor}
            size="lg"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{depot.name}</h1>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-red-400" />
                  {depot.address}, {depot.state}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {depot.isVerified && (
                  <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-xl px-2.5 py-1">
                    <Shield className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-bold text-green-700">NMDPRA Verified</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "w-4 h-4",
                        s <= Math.floor(depot.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"
                      )}
                    />
                  ))}
                  <span className="text-sm font-bold text-slate-700 ml-1">{depot.rating}</span>
                  <span className="text-xs text-slate-400">({depot.reviewCount})</span>
                </div>
              </div>
            </div>

            {/* Contact row */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
              <a href={`tel:${depot.phone}`} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                <Phone className="w-4 h-4" />
                {depot.phone}
              </a>
              <a href={`mailto:${depot.email}`} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                <Mail className="w-4 h-4" />
                {depot.email}
              </a>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {depot.operatingHours}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          {[
            { label: "Total Orders", value: depot.stats.totalOrders.toLocaleString() },
            { label: "Avg. Loading", value: depot.stats.averageLoadingTime },
            { label: "On-Time Rate", value: `${depot.stats.onTimeRate}%` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-3 mt-4">
          <Link href={`/marketer/chat?depot=${depot.id}`} className="flex-1">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Chat Depot (Get Price)
            </Button>
          </Link>
          <a href={depot.googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="md" leftIcon={<Navigation className="w-4 h-4" />}>
              Navigate
            </Button>
          </a>
        </div>

        {/* Price notice */}
        <div className="mt-3 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
          <Bot className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-primary-700">
            <strong>Prices are not publicly listed.</strong> Start a chat — the depot&apos;s AI will share current
            pricing for your requested product and quantity. You can negotiate directly.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 text-xs sm:text-sm font-semibold py-2 rounded-xl transition-all duration-200",
              activeTab === tab.id
                ? "bg-white text-primary-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-slate-900">About This Depot</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{depot.description}</p>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Products Available
              </p>
              <div className="flex flex-wrap gap-2">
                {depot.products.map((p) => {
                  const cfg = stockLevelConfig[p.stockLevel];
                  return (
                    <div key={p.id} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg", cfg.bg)}>
                      <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                      <span className={cn("text-xs font-bold", cfg.color)}>{p.type}</span>
                      <span className={cn("text-[10px]", cfg.color)}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                AI Chat Language
              </p>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-slate-700">
                  {{ en: "English", ha: "Hausa", yo: "Yoruba", ig: "Igbo", pcm: "Pidgin" }[depot.preferredChatLanguage]}
                  {" "}<span className="text-slate-400 text-xs">+ voice note transcription</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-3">
          {depot.products.map((product) => {
            const cfg = stockLevelConfig[product.stockLevel];
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                        {product.type}
                      </span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900">{product.name}</h3>
                  </div>

                  {/* Stock bar */}
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">
                      {(product.stockLitres / 1_000_000).toFixed(1)}M litres
                    </p>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", cfg.dot)}
                        style={{
                          width: product.stockLevel === "high" ? "85%" : product.stockLevel === "medium" ? "50%" : "20%"
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Source", value: product.specifications.source },
                    { label: "Density", value: `${product.specifications.density} kg/m³` },
                    { label: "Test Date", value: product.specifications.testDate },
                    { label: "Color", value: product.specifications.color },
                  ].map((spec) => (
                    <div key={spec.label} className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{spec.label}</p>
                      <p className="text-xs font-semibold text-slate-800">{spec.value}</p>
                    </div>
                  ))}
                </div>

                {/* No price shown — chat CTA */}
                <div className="mt-3 flex items-center justify-between bg-primary-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-primary-500" />
                    <p className="text-xs text-primary-700 font-medium">
                      Chat depot AI to get {product.type} price
                    </p>
                  </div>
                  <Link href={`/marketer/chat?depot=${depot.id}&product=${product.type}`}>
                    <button className="text-xs font-bold text-secondary-600 hover:text-secondary-700 flex items-center gap-1">
                      Chat <ChevronRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "map" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 mb-4">Depot Location</h2>
          <DepotMap
            depotName={depot.name}
            address={depot.address}
            coordinates={depot.coordinates}
            googleMapsUrl={depot.googleMapsUrl}
            showTravelPredictor
          />
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-3">
          {MOCK_REVIEWS.map((review, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-bold text-sm">
                    {review.author.charAt(0)}
                  </div>
                  <span className="font-semibold text-slate-900 text-sm">{review.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-3.5 h-3.5", s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600">{review.comment}</p>
              <p className="text-xs text-slate-400 mt-2">{review.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}