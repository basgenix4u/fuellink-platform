// src/app/depot/orders/page.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Package,
  ChevronDown,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "in-transit"
  | "at-depot"
  | "loading"
  | "loaded"
  | "completed"
  | "cancelled";

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  product: {
    type: string;
    quantity: number;
    pricePerLitre: number;
    total: number;
  };
  truck: {
    plateNumber: string;
    driver: string;
  };
  status: OrderStatus;
  createdAt: string;
  pickupDate: string;
}

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2025-001234",
    customer: { name: "Sahara Energy Resources", phone: "+234 802 345 6789" },
    product: { type: "AGO", quantity: 33000, pricePerLitre: 1150, total: 37950000 },
    truck: { plateNumber: "ABC-123XY", driver: "Musa Ibrahim" },
    status: "loading",
    createdAt: "2025-02-19T10:45:00Z",
    pickupDate: "2025-02-19",
  },
  {
    id: "2",
    orderNumber: "ORD-2025-001233",
    customer: { name: "Matrix Petroleum Ltd", phone: "+234 803 456 7890" },
    product: { type: "PMS", quantity: 45000, pricePerLitre: 890, total: 40050000 },
    truck: { plateNumber: "DEF-456AB", driver: "Chukwu Emmanuel" },
    status: "confirmed",
    createdAt: "2025-02-19T10:30:00Z",
    pickupDate: "2025-02-19",
  },
  {
    id: "3",
    orderNumber: "ORD-2025-001232",
    customer: { name: "Golden Oil Company", phone: "+234 804 567 8901" },
    product: { type: "AGO", quantity: 33000, pricePerLitre: 1150, total: 37950000 },
    truck: { plateNumber: "GHI-789CD", driver: "Adamu Bello" },
    status: "pending",
    createdAt: "2025-02-19T10:15:00Z",
    pickupDate: "2025-02-19",
  },
  {
    id: "4",
    orderNumber: "ORD-2025-001231",
    customer: { name: "Premier Fuel Distributors", phone: "+234 805 678 9012" },
    product: { type: "DPK", quantity: 20000, pricePerLitre: 1100, total: 22000000 },
    truck: { plateNumber: "JKL-012EF", driver: "Okonkwo James" },
    status: "completed",
    createdAt: "2025-02-19T09:45:00Z",
    pickupDate: "2025-02-19",
  },
  {
    id: "5",
    orderNumber: "ORD-2025-001230",
    customer: { name: "National Oil Marketers", phone: "+234 806 789 0123" },
    product: { type: "AGO", quantity: 45000, pricePerLitre: 1150, total: 51750000 },
    truck: { plateNumber: "MNO-345GH", driver: "Yakubu Aliyu" },
    status: "completed",
    createdAt: "2025-02-19T09:00:00Z",
    pickupDate: "2025-02-19",
  },
  {
    id: "6",
    orderNumber: "ORD-2025-001229",
    customer: { name: "Swift Petroleum Services", phone: "+234 807 890 1234" },
    product: { type: "PMS", quantity: 33000, pricePerLitre: 890, total: 29370000 },
    truck: { plateNumber: "PQR-678IJ", driver: "Emeka Nwosu" },
    status: "cancelled",
    createdAt: "2025-02-19T08:30:00Z",
    pickupDate: "2025-02-19",
  },
  {
    id: "7",
    orderNumber: "ORD-2025-001228",
    customer: { name: "Atlantic Fuel Depot", phone: "+234 808 901 2345" },
    product: { type: "AGO", quantity: 45000, pricePerLitre: 1145, total: 51525000 },
    truck: { plateNumber: "STU-901KL", driver: "Ibrahim Musa" },
    status: "at-depot",
    createdAt: "2025-02-19T08:00:00Z",
    pickupDate: "2025-02-19",
  },
];

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "default" | "primary" | "secondary" | "success" | "warning" | "danger"; icon: React.ElementType }
> = {
  pending: { label: "Pending", variant: "warning", icon: Clock },
  confirmed: { label: "Confirmed", variant: "primary", icon: CheckCircle2 },
  "in-transit": { label: "In Transit", variant: "secondary", icon: Truck },
  "at-depot": { label: "At Depot", variant: "secondary", icon: Package },
  loading: { label: "Loading", variant: "secondary", icon: Package },
  loaded: { label: "Loaded", variant: "primary", icon: CheckCircle2 },
  completed: { label: "Completed", variant: "success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", variant: "danger", icon: XCircle },
};

const statusTabs = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "loading", label: "Loading" },
  { id: "completed", label: "Completed" },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const filteredOrders = mockOrders.filter((order) => {
    const matchesTab =
      activeTab === "all" ||
      order.status === activeTab ||
      (activeTab === "loading" &&
        ["at-depot", "loading", "loaded"].includes(order.status));

    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500">
            Manage and track all incoming orders
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="md">
            <Calendar className="w-4 h-4 mr-2" />
            Filter by Date
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-500">Total Orders Today</p>
          <p className="text-2xl font-bold text-slate-900">23</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-warning-600">5</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="text-2xl font-bold text-secondary-600">8</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-success-600">10</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {/* Status Tabs */}
        <div className="border-b border-slate-100 px-4">
          <div className="flex gap-1 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders or customers..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {selectedOrders.length} selected
              </span>
              <Button variant="outline" size="sm">
                Bulk Accept
              </Button>
              <Button variant="ghost" size="sm" className="text-danger-600">
                Bulk Reject
              </Button>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-100">
                <th className="w-12 py-4 px-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.length === filteredOrders.length &&
                      filteredOrders.length > 0
                    }
                    onChange={toggleAllOrders}
                    className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                  />
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">
                  Order
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">
                  Customer
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">
                  Product
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">
                  Amount
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">
                  Truck
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">
                  Status
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusInfo = statusConfig[order.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {order.customer.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">{order.product.type}</Badge>
                        <span className="text-sm text-slate-600">
                          {formatNumber(order.product.quantity)}L
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.product.total)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm text-slate-900">
                          {order.truck.plateNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.truck.driver}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={statusInfo.variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/depot/orders/${order.id}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No orders found
            </h3>
            <p className="text-slate-500">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Orders will appear here when customers place them"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {filteredOrders.length} of {mockOrders.length} orders
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}