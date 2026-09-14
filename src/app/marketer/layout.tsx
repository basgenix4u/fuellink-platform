// src/app/marketer/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  Wallet,
  Bell as BellIcon,
  Settings,
  HelpCircle,
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  User,
  MessageSquare,
  TrendingUp,
  Newspaper,
  Bot,
  AlertCircle,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

// Nav links — driver removed, prices removed, fleet removed
// Added: chat, AI predictor, media
const navLinks = [
  {
    href: "/marketer",
    label: "Dashboard",
    icon: LayoutDashboard,
    badge: null,
    exact: true,
  },
  {
    href: "/marketer/depots",
    label: "Find Depots",
    icon: Building2,
    badge: null,
    exact: false,
  },
  {
    href: "/marketer/chat",
    label: "Depot Chat",
    icon: MessageSquare,
    badge: "3", // unread conversations
    exact: false,
    requiresSubscription: true,
  },
  {
    href: "/marketer/orders",
    label: "My Orders",
    icon: ShoppingCart,
    badge: null,
    exact: false,
  },
  {
    href: "/marketer/predictor",
    label: "AI Price Predictor",
    icon: TrendingUp,
    badge: "AI",
    exact: false,
    requiresSubscription: true,
  },
  {
    href: "/marketer/refineries",
    label: "Refinery Prices",
    icon: Bot,
    badge: null,
    exact: false,
  },
  {
    href: "/marketer/media",
    label: "Media Hub",
    icon: Newspaper,
    badge: null,
    exact: false,
  },
  {
    href: "/marketer/alerts",
    label: "Alerts",
    icon: BellIcon,
    badge: "2",
    exact: false,
  },
  {
    href: "/marketer/wallet",
    label: "Wallet",
    icon: Wallet,
    badge: null,
    exact: false,
  },
  {
    href: "/marketer/disputes",
    label: "Disputes",
    icon: HelpCircle,
    badge: null,
    exact: false,
  },
  {
    href: "/marketer/settings",
    label: "Settings",
    icon: Settings,
    badge: null,
    exact: false,
  },
];

// Mock subscription status — replace with real state management
const MOCK_SUBSCRIPTION_STATUS = "active"; // "active" | "expired" | "none"

export default function MarketerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isSubscribed = MOCK_SUBSCRIPTION_STATUS === "active";

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-100">
          <Logo variant="default" size="md" />
        </div>

        {/* Subscription badge */}
        {!isSubscribed && (
          <div className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">No active subscription</p>
              <Link href="/marketer/subscribe" className="text-xs text-amber-600 underline">
                Subscribe to unlock chat & AI
              </Link>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive =
              link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);

            const isLocked = link.requiresSubscription && !isSubscribed;

            return (
              <Link
                key={link.href}
                href={isLocked ? "/marketer/subscribe" : link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-secondary-50 text-secondary-700"
                    : isLocked
                    ? "text-slate-400 hover:bg-slate-50 cursor-pointer"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <link.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-secondary-500" : isLocked ? "text-slate-300" : "text-slate-400"
                  )}
                />
                <span className="flex-1 text-sm">{link.label}</span>

                {/* Badge */}
                {link.badge && !isLocked && (
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-bold",
                      link.badge === "AI"
                        ? "bg-primary-100 text-primary-700"
                        : "bg-red-100 text-red-600"
                    )}
                  >
                    {link.badge}
                  </span>
                )}

                {/* Lock icon for subscription-gated links */}
                {isLocked && (
                  <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                    Pro
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-xl bg-secondary-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-secondary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Adamu Petroleum</p>
              <p className="text-xs text-slate-500 truncate">
                {isSubscribed ? (
                  <span className="text-green-600">● Subscribed</span>
                ) : (
                  <span className="text-amber-500">● No subscription</span>
                )}
              </p>
            </div>
            <LogOut className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search depots, orders..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Subscribe CTA if not subscribed */}
            {!isSubscribed && (
              <Link href="/marketer/subscribe">
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-secondary-500 text-white text-xs font-semibold rounded-xl hover:bg-secondary-600 transition-colors">
                  ⚡ Subscribe
                </button>
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}