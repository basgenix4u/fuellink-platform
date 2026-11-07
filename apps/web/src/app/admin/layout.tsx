"use client";

import {
  LayoutGrid,
  Building2,
  AlertOctagon,
} from "lucide-react";
import { DashboardShell, type ShellNavItem } from "@/components/ui/DashboardShell";

const nav: ShellNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/depots", label: "Depot oversight", icon: Building2 },
  { href: "/admin/disputes", label: "Disputes & reports", icon: AlertOctagon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      nav={nav}
      accent="indigo"
      searchPlaceholder="Search depots, licences, marketers"
      workspace={{ name: "Regulator oversight", meta: "FuelLink operations", tag: "Regulator" }}
      user={{ name: "Compliance desk", role: "Administrator" }}
      settingsHref="/admin/settings"
    >
      {children}
    </DashboardShell>
  );
}
