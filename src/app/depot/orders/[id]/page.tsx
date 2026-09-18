// src/app/depot/orders/[id]/page.tsx

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Truck,
  User,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  Download,
  MessageSquare,
  DollarSign,
  Shield,
  Copy,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

// Mock order data
const orderData = {
  id: "1",
  orderNumber: "ORD-2025-001234",
  status: "loading" as const,
  createdAt: "2025-02-19T10:45:00Z",
  pickupDate: "2025-02-19",
  
  customer: {
    name: "Sahara Energy Resources",
    phone: "+234 802 345 6789",
    email: "orders@saharaenergy.ng",
    address: "15 Industrial Avenue, Ikeja, Lagos",
    totalOrders: 47,
    memberSince: "2024-03-15",
  },
  
  product: {
    type: "AGO",
    name: "Automotive Gas Oil (Diesel)",
    quantity: 33000,
    pricePerLitre: 1150,
    total: 37950000,
    platformFee: 37950,
    netAmount: 37912050,
    specifications: {
      color: "Clear Straw",
      density: "845 kg/m³",
      source: "Dangote Refinery",
      sulfurContent: "10 ppm",
    },
  },
  
  truck: {
    plateNumber: "ABC-123XY",
    capacity: 45000,
    type: "Tanker Truck",
  },
  
  driver: {
    name: "Musa Ibrahim",
    phone: "+234 803 456 7890",
    licenseNumber: "DRV-2024-78901",
  },
  
  qrCode: "FUELLINK-ORD2025001234-VERIFY",
  
  escrow: {
    status: "locked",
    amount: 37950000,
    lockedAt: "2025-02-19T10:45:00Z",
  },
  
  timeline: [
    {
      status: "pending",
      timestamp: "2025-02-19T10:45:00Z",
      note: "Order placed by customer",
      icon: Clock,
    },
    {
      status: "confirmed",
      timestamp: "2025-02-19T10:50:00Z",
      note: "Order confirmed by depot",
      icon: CheckCircle2,
    },
    {
      status: "in-transit",
      timestamp: "2025-02-19T11:30:00Z",
      note: "Truck dispatched to depot",
      icon: Truck,
    },
    {
      status: "at-depot",
      timestamp: "2025-02-19T14:15:00Z",
      note: "Truck arrived at depot gate",
      icon: MapPin,
    },
    {
      status: "loading",
      timestamp: "2025-02-19T14:30:00Z",
      note: "Loading in progress",
      icon: Package,
      current: true,
    },
  ],
};

const statusConfig = {
  pending: { label: "Pending", color: "warning", canAccept: true, canReject: true },
  confirmed: { label: "Confirmed", color: "primary", canAccept: false, canReject: true },
  "in-transit": { label: "In Transit", color: "secondary", canAccept: false, canReject: false },
  "at-depot": { label: "At Depot", color: "secondary", canAccept: false, canReject: false },
  loading: { label: "Loading", color: "secondary", canConfirmLoading: true, canAccept: false, canReject: false },
  loaded: { label: "Loaded", color: "primary", canConfirmLoading: false, canAccept: false, canReject: false },
  completed: { label: "Completed", color: "success", canAccept: false, canReject: false },
  cancelled: { label: "Cancelled", color: "danger", canAccept: false, canReject: false },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const order = orderData;
  const status = statusConfig[order.status];

  const handleAcceptOrder = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Order accepted successfully!");
    setIsProcessing(false);
  };

  const handleRejectOrder = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Order rejected");
    setIsProcessing(false);
  };

  const handleConfirmLoading = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Loading confirmed! Awaiting driver confirmation to release payment.");
    setIsProcessing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/depot/orders"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {order.orderNumber}
              </h1>
              <Badge
                variant={status.color as "warning" | "primary" | "secondary" | "success" | "danger"}
                className="text-sm"
              >
                {status.label}
              </Badge>
            </div>
            <p className="text-slate-500">
              Created {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {status.canReject && (
            <Button
              variant="outline"
              size="md"
              onClick={handleRejectOrder}
              isLoading={isProcessing}
              className="text-danger-600 border-danger-200 hover:bg-danger-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Order
            </Button>
          )}
          {status.canAccept && (
            <Button
              variant="primary"
              size="md"
              onClick={handleAcceptOrder}
              isLoading={isProcessing}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept Order
            </Button>
          )}
          {status.canConfirmLoading && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleConfirmLoading}
              isLoading={isProcessing}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm Loading Complete
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Product Details
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Package className="w-8 h-8 text-primary-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="primary" size="lg">
                      {order.product.type}
                    </Badge>
                  </div>
                  <p className="text-slate-600">{order.product.name}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-50">
                  <p className="text-sm text-slate-500 mb-1">Quantity</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatNumber(order.product.quantity)} Litres
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50">
                  <p className="text-sm text-slate-500 mb-1">Price per Litre</p>
                  <p className="text-xl font-bold text-slate-900">
                    ₦{formatNumber(order.product.pricePerLitre)}
                  </p>
                </div>
              </div>

              {/* Product Specifications */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Product Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(order.product.specifications).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-slate-500 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="font-medium text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Customer Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Customer Information
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-secondary-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-secondary-600">
                    {order.customer.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {order.customer.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {order.customer.totalOrders} orders • Member since{" "}
                    {new Date(order.customer.memberSince).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="hover:text-primary-600"
                  >
                    {order.customer.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <a
                    href={`mailto:${order.customer.email}`}
                    className="hover:text-primary-600"
                  >
                    {order.customer.email}
                  </a>
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <span>{order.customer.address}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Truck & Driver Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Truck & Driver
              </h2>
            </div>
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Truck Info */}
                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <Truck className="w-5 h-5 text-primary-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Truck</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plate Number</span>
                      <span className="font-medium text-slate-900">
                        {order.truck.plateNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capacity</span>
                      <span className="font-medium text-slate-900">
                        {formatNumber(order.truck.capacity)}L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type</span>
                      <span className="font-medium text-slate-900">
                        {order.truck.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <User className="w-5 h-5 text-secondary-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Driver</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name</span>
                      <span className="font-medium text-slate-900">
                        {order.driver.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone</span>
                      <a
                        href={`tel:${order.driver.phone}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {order.driver.phone}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">License</span>
                      <span className="font-medium text-slate-900">
                        {order.driver.licenseNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Timeline, Payment, QR */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Payment Summary
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900">
                    {formatCurrency(order.product.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform Fee (0.1%)</span>
                  <span className="text-slate-900">
                    -{formatCurrency(order.product.platformFee)}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-900">
                      You Receive
                    </span>
                    <span className="font-bold text-xl text-primary-600">
                      {formatCurrency(order.product.netAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Escrow Status */}
              <div className="p-4 rounded-xl bg-success-50 border border-success-100">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-success-600" />
                  <span className="font-semibold text-success-800">
                    Escrow Protected
                  </span>
                </div>
                <p className="text-sm text-success-700">
                  Funds are securely held and will be released upon confirmed
                  loading.
                </p>
              </div>
            </div>
          </motion.div>

          {/* QR Verification Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Verification Code
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-slate-900 rounded-xl p-6 text-center mb-4">
                <QrCode className="w-24 h-24 text-white mx-auto mb-4" />
                <p className="text-white/70 text-sm">
                  Scan to verify this order
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <code className="flex-1 text-sm font-mono text-slate-700 truncate">
                  {order.qrCode}
                </code>
                <button
                  onClick={() => copyToClipboard(order.qrCode)}
                  className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <Link href="/depot/verification">
                <Button variant="outline" size="md" className="w-full mt-4">
                  <QrCode className="w-4 h-4 mr-2" />
                  Open QR Scanner
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Order Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Order Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.timeline.map((event, index) => {
                  const Icon = event.icon;
                  const isLast = index === order.timeline.length - 1;

                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            event.current
                              ? "bg-secondary-100 text-secondary-600"
                              : "bg-primary-100 text-primary-600"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 h-full bg-slate-200 my-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-slate-900">
                          {event.note}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatDateTime(event.timestamp)}
                        </p>
                        {event.current && (
                          <Badge variant="secondary" className="mt-2">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}