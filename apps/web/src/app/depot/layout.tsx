"use client";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Wallet,
  Star,
  Settings,
  MessageSquare,
  DollarSign,
  CheckCircle2,
  Bot,
} from "lucide-react";
import { DashboardShell, type ShellNavItem } from "@/components/ui/DashboardShell";

const nav: ShellNavItem[] = [
  { href: "/depot", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/depot/orders", label: "Orders", icon: ShoppingCart, badge: "4" },
  { href: "/depot/chat", label: "Marketer chat", icon: MessageSquare, badge: "2" },
  { href: "/depot/inventory", label: "Inventory", icon: Package },
  { href: "/depot/private-prices", label: "Set prices", icon: DollarSign },
  { href: "/depot/ai-settings", label: "Chatbot setup", icon: Bot },
  { href: "/depot/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/depot/wallet", label: "Wallet", icon: Wallet },
  { href: "/depot/ratings", label: "Ratings", icon: Star },
  { href: "/depot/verification", label: "Verification", icon: CheckCircle2 },
  { href: "/depot/settings", label: "Settings", icon: Settings },
];

export default function DepotLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={nav}
      accent="brand"
      searchPlaceholder="Search orders, marketers, tanks"
      workspace={{ name: "Depot console", meta: "NMDPRA verified operator", tag: "Verified" }}
      user={{ name: "Depot admin", role: "Depot owner" }}
      settingsHref="/depot/settings"
    >
      {children}
    </DashboardShell>
  );
}
