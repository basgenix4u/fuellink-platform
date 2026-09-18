// src/app/marketer/orders/[id]/page.tsx

"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  QrCode,
  Download,
  Share2,
  Copy,
  Truck,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Package,
  Shield,
  ExternalLink,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/shared/Button";
import { Badge, OrderStatusBadge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

interface TruckQR {
  id: string;
  truckNumber: number;
  plateNumber: string;
  quantity: number;
  qrCode: string;
  driverName?: string;
  driverPhone?: string;
  status: "pending" | "verified" | "loading" | "loaded" | "completed";
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  depot: {
    id: string;
    name: string;
    location: string;
    phone: string;
  };
  product: {
    type: string;
    name: string;
    pricePerLitre: number;
  };
  trucks: TruckQR[];
  totalQuantity: number;
  productCost: number;
  platformFee: number;
  totalAmount: number;
  pickupDate: string;
  createdAt: string;
  escrowStatus: "locked" | "partial" | "released";
}

// Mock order data
const mockOrder: OrderDetail = {
  id: "ORD-2025-001237",
  orderNumber: "ORD-2025-001237",
  status: "confirmed",
  depot: {
    id: "depot-001",
    name: "Pinnacle Oil & Gas Terminal",
    location: "Apapa, Lagos",
    phone: "+234 801 234 5678",
  },
  product: {
    type: "AGO",
    name: "Automotive Gas Oil (Diesel)",
    pricePerLitre: 1150,
  },
  trucks: [
    {
      id: "truck-1",
      truckNumber: 1,
      plateNumber: "ABC-123XY",
      quantity: 33000,
      qrCode: "FUELLINK-ORD2025001237-T1-VERIFY",
      driverName: "Musa Ibrahim",
      driverPhone: "+234 803 456 7890",
      status: "pending",
    },
    {
      id: "truck-2",
      truckNumber: 2,
      plateNumber: "DEF-456AB",
      quantity: 45000,
      qrCode: "FUELLINK-ORD2025001237-T2-VERIFY",
      driverName: "Chukwu Emmanuel",
      driverPhone: "+234 804 567 8901",
      status: "pending",
    },
  ],
  totalQuantity: 78000,
  productCost: 89700000,
  platformFee: 19500,
  totalAmount: 89719500,
  pickupDate: "2025-02-20",
  createdAt: "2025-02-19T10:30:00Z",
  escrowStatus: "locked",
};

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  // In a real app, order data is fetched server-side from params.id
  const [order, setOrder] = useState<OrderDetail>(() => ({
    ...mockOrder,
    id: params.id as string,
    orderNumber: params.id as string,
  }));
  const [selectedTruck, setSelectedTruck] = useState<TruckQR | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(isSuccess);

  const copyQRCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("QR code copied to clipboard");
  };

  const downloadQR = (truckId: string, plateNumber: string) => {
    const svg = document.getElementById(`qr-${truckId}`);
    if (svg) {
      // Convert SVG to downloadable image
      toast.success(`QR code for ${plateNumber} downloaded`);
    }
  };

  const shareQR = (truck: TruckQR) => {
    if (navigator.share) {
      navigator.share({
        title: `FuelLink Order ${order.orderNumber} - ${truck.plateNumber}`,
        text: `QR Code for pickup: ${truck.qrCode}`,
      });
    } else {
      copyQRCode(truck.qrCode);
    }
  };

  const getStatusColor = (status: TruckQR["status"]) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700";
      case "verified": return "bg-blue-100 text-blue-700";
      case "loading": return "bg-purple-100 text-purple-700";
      case "loaded": return "bg-emerald-100 text-emerald-700";
      case "completed": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Modal */}
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        >
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Order Placed Successfully!
            </h2>
            <p className="text-slate-600 mb-6">
              Your order has been confirmed. {order.trucks.length} QR code(s) have been 
              generated for your trucks.
            </p>
            <div className="p-4 bg-emerald-50 rounded-xl mb-6">
              <p className="text-sm text-emerald-700">
                <strong>₦{formatNumber(order.totalAmount)}</strong> has been locked in escrow
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setShowSuccessModal(false)}
            >
              View QR Codes
            </Button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/marketer/orders"
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-slate-500">{order.depot.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/marketer/messages?depot=${order.depot.id}`}>
            <Button variant="outline" size="md" leftIcon={<MessageSquare className="w-4 h-4" />}>
              Message Depot
            </Button>
          </Link>
          <Link href={`/marketer/disputes/new?order=${order.id}`}>
            <Button variant="ghost" size="md" leftIcon={<AlertTriangle className="w-4 h-4" />}>
              Report Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Product</p>
            <div className="flex items-center gap-2">
              <Badge variant="primary">{order.product.type}</Badge>
              <span className="font-semibold">{formatNumber(order.totalQuantity)} L</span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Total Amount</p>
            <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500 mb-1">Pickup Date</p>
            <p className="font-semibold">
              {new Date(order.pickupDate).toLocaleDateString("en-NG", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <p className="text-sm text-emerald-600 mb-1">Escrow Status</p>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-700 capitalize">{order.escrowStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Codes Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pickup QR Codes</h2>
            <p className="text-slate-500 text-sm">
              Share these QR codes with your drivers for depot verification
            </p>
          </div>
          <Badge variant="secondary" size="lg">
            {order.trucks.length} Truck(s)
          </Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {order.trucks.map((truck) => (
            <motion.div
              key={truck.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-shadow"
            >
              {/* Truck Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{truck.plateNumber}</p>
                    <p className="text-sm text-slate-500">Truck {truck.truckNumber}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(truck.status)}>
                  {truck.status}
                </Badge>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white border border-slate-100 rounded-xl mb-4">
                <QRCodeSVG
                  id={`qr-${truck.id}`}
                  value={truck.qrCode}
                  size={160}
                  level="H"
                  includeMargin
                />
              </div>

              {/* QR Code String */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg mb-4">
                <code className="flex-1 text-xs text-slate-600 font-mono truncate">
                  {truck.qrCode}
                </code>
                <button
                  onClick={() => copyQRCode(truck.qrCode)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Truck Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-medium">{formatNumber(truck.quantity)} L</span>
                </div>
                {truck.driverName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Driver</span>
                    <span className="font-medium">{truck.driverName}</span>
                  </div>
                )}
                {truck.driverPhone && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Phone</span>
                    <a href={`tel:${truck.driverPhone}`} className="font-medium text-primary-600">
                      {truck.driverPhone}
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => downloadQR(truck.id, truck.plateNumber)}
                >
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  leftIcon={<Share2 className="w-4 h-4" />}
                  onClick={() => shareQR(truck)}
                >
                  Share
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Depot Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Depot Information</h2>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">{order.depot.name}</p>
                <p className="text-sm text-slate-500">{order.depot.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-400" />
              <a href={`tel:${order.depot.phone}`} className="text-primary-600 font-medium">
                {order.depot.phone}
              </a>
            </div>
          </div>
          <Link href={`/marketer/depots/${order.depot.id}`}>
            <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-4 h-4" />}>
              View Depot
            </Button>
          </Link>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Pickup Instructions</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <span>Share the QR code with your truck driver before they leave</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <span>Driver presents QR code at depot gate for verification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <span>Depot scans and verifies the order details</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
            <span>After loading, both parties confirm to release escrow payment</span>
          </li>
        </ol>
      </div>
    </div>
  );
}