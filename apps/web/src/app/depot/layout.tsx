// src/app/depot/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Wallet,
  Star,
  Settings,
  HelpCircle,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  User,
  Building2,
  MessageSquare,
  DollarSign,
  Megaphone,
  CheckCircle2,
  Bot,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

// Nav links — driver removed, prices replaced by private price-setting, chat added, ads added
const navLinks = [
  {
    href: "/depot",
    label: "Dashboard",
    icon: LayoutDashboard,
    badge: null,
    exact: true,
  },
  {
    href: "/depot/orders",
    label: "Orders",
    icon: ShoppingCart,
    badge: "4", // pending orders
    exact: false,
  },
  {
    href: "/depot/chat",
    label: "Marketer Chat",
    icon: MessageSquare,
    badge: "2", // unread chats needing depot attention
    exact: false,
  },
  {
    href: "/depot/inventory",
    label: "Inventory",
    icon: Package,
    badge: null,
    exact: false,
  },
  {
    href: "/depot/private-prices",
    label: "Set Prices (Private)",
    icon: DollarSign,
    badge: null,
    exact: false,
  },
  {
    href: "/depot/ai-settings",
    label: "AI Chatbot Setup",
    icon: Bot,
    badge: null,
    exact: false,
  },
  {
    href: "/depot/advertise",
    label: "Advertise",
    icon: Megaphone,
    badge: null,
    exact: false,
  },
  {
    href: "/depot/analytics",
    label: "Analytics",
    icon: BarChart3,
    badge: null,
    exact: false,
  },
  {
    href: "/depot/wallet",
    label: "Wallet",
    icon: Wallet,
    badge: null,
    exact: false,
  },
  {
    href: "/depot/ratings",
    label: "Ratings",
    icon: Star,
    badge: null,
    exact: false,
  },
  {
    href: "/depot/verification",
    label: "Verification",
    icon: CheckCircle2,
    badge: null,
    exact: false,
  },
  {
    href: "/depot/disputes",
    label: "Disputes",
    icon: HelpCircle,
    badge: null,
    exact: false,
  },
  {
    href: "/depot/settings",
    label: "Settings",
    icon: Settings,
    badge: null,
    exact: false,
  },
];

export default function DepotLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          <p className="text-xs text-slate-500 mt-1">Depot Portal</p>
        </div>

        {/* Verification status */}
        <div className="mx-3 mt-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-xs font-semibold text-green-800">NMDPRA Verified</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <link.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-primary-500" : "text-slate-400"
                  )}
                />
                <span className="flex-1 text-sm">{link.label}</span>

                {link.badge && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-600">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Pinnacle Oil Terminal</p>
              <p className="text-xs text-slate-500 truncate">Lagos · 4 tanks</p>
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
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search orders, marketers..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
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