// src/app/marketer/orders/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";

const orders = [
  {
    id: "ORD-2025-001237",
    depot: "Pinnacle Oil & Gas",
    product: "AGO",
    quantity: 33000,
    amount: 37987950,
    status: "pending",
    createdAt: "2025-02-19T15:00:00Z",
    pickupDate: "2025-02-20",
  },
  {
    id: "ORD-2025-001236",
    depot: "Sahara Energy Terminal",
    product: "AGO",
    quantity: 33000,
    amount: 37884000,
    status: "confirmed",
    createdAt: "2025-02-19T10:30:00Z",
    pickupDate: "2025-02-20",
  },
  {
    id: "ORD-2025-001235",
    depot: "Matrix Energy Depot",
    product: "PMS",
    quantity: 45000,
    amount: 40050000,
    status: "in-transit",
    createdAt: "2025-02-19T08:00:00Z",
    pickupDate: "2025-02-19",
  },
  {
    id: "ORD-2025-001234",
    depot: "Pinnacle Oil & Gas",
    product: "AGO",
    quantity: 33000,
    amount: 37950000,
    status: "loading",
    createdAt: "2025-02-19T06:00:00Z",
    pickupDate: "2025-02-19",
  },
  {
    id: "ORD-2025-001233",
    depot: "Oando Supply Terminal",
    product: "DPK",
    quantity: 20000,
    amount: 22000000,
    status: "completed",
    createdAt: "2025-02-18T14:00:00Z",
    pickupDate: "2025-02-18",
  },
  {
    id: "ORD-2025-001232",
    depot: "Ardova Depot",
    product: "AGO",
    quantity: 45000,
    amount: 51390000,
    status: "completed",
    createdAt: "2025-02-17T10:00:00Z",
    pickupDate: "2025-02-17",
  },
  {
    id: "ORD-2025-001231",
    depot: "Matrix Energy Depot",
    product: "PMS",
    quantity: 33000,
    amount: 29205000,
    status: "cancelled",
    createdAt: "2025-02-16T12:00:00Z",
    pickupDate: "2025-02-16",
  },
];

const statusConfig: Record<
  string,
  { label: string; variant: "warning" | "primary" | "secondary" | "success" | "danger"; icon: React.ElementType }
> = {
  pending: { label: "Pending", variant: "warning", icon: Clock },
  confirmed: { label: "Confirmed", variant: "primary", icon: CheckCircle2 },
  "in-transit": { label: "In Transit", variant: "secondary", icon: Truck },
  loading: { label: "Loading", variant: "secondary", icon: Package },
  completed: { label: "Completed", variant: "success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", variant: "danger", icon: XCircle },
};

const statusTabs = ["all", "active", "completed", "cancelled"];

export default function MarketerOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter((order) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && !["completed", "cancelled"].includes(order.status)) ||
      (activeTab === "completed" && order.status === "completed") ||
      (activeTab === "cancelled" && order.status === "cancelled");

    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.depot.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-slate-500">Track and manage your orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/marketer/depots">
            <Button variant="secondary" size="md">
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="border-b border-slate-100 px-4">
          <div className="flex gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-4 text-sm font-medium border-b-2 transition-colors capitalize",
                  activeTab === tab
                    ? "border-secondary-500 text-secondary-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full sm:w-80 pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="divide-y divide-slate-100">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;

            return (
              <Link key={order.id} href={`/marketer/orders/${order.id}`}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        order.status === "completed" && "bg-success-100 text-success-600",
                        order.status === "cancelled" && "bg-danger-100 text-danger-600",
                        !["completed", "cancelled"].includes(order.status) && "bg-secondary-100 text-secondary-600"
                      )}>
                        <StatusIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{order.id}</h3>
                          <Badge variant="primary">{order.product}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {order.depot} • {formatNumber(order.quantity)}L
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(order.amount)}</p>
                      <Badge variant={status.variant} size="sm" className="mt-1">
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No orders found</h3>
            <p className="text-slate-500">Your orders will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}