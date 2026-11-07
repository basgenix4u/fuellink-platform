"use client";

import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  Wallet,
  Bell,
  Settings,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  Bot,
} from "lucide-react";
import { DashboardShell, type ShellNavItem } from "@/components/ui/DashboardShell";

const nav: ShellNavItem[] = [
  { href: "/marketer", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/marketer/depots", label: "Find depots", icon: Building2 },
  { href: "/marketer/orders", label: "My orders", icon: ShoppingCart },
  { href: "/marketer/chat", label: "Depot chat", icon: MessageSquare, badge: "3" },
  { href: "/marketer/predictor", label: "Price predictor", icon: TrendingUp, badge: "AI" },
  { href: "/marketer/refineries", label: "Refinery prices", icon: Bot },
  { href: "/marketer/alerts", label: "Alerts", icon: Bell, badge: "2" },
  { href: "/marketer/wallet", label: "Wallet", icon: Wallet },
  { href: "/marketer/disputes", label: "Disputes", icon: HelpCircle },
  { href: "/marketer/settings", label: "Settings", icon: Settings },
];

export default function MarketerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={nav}
      accent="ember"
      searchPlaceholder="Search depots, orders, products"
      workspace={{ name: "Adamu Petroleum", meta: "Marketer workspace", tag: "Subscribed" }}
      user={{ name: "Adamu Petroleum", role: "Marketer" }}
      settingsHref="/marketer/settings"
    >
      {children}
    </DashboardShell>
  );
}
