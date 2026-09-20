// src/app/marketer/orders/new/page.tsx

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Truck,
  CreditCard,
  CheckCircle2,
  Shield,
  AlertCircle,
  Plus,
  Trash2,
  QrCode,
  Info,
  Fuel,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

// Types
interface TruckOrder {
  id: string;
  plateNumber: string;
  capacity: number;
  quantity: number;
  driverName: string;
  driverPhone: string;
  nupengTicket: string; // Optional NUPENG compliance
}

interface DepotInfo {
  id: string;
  name: string;
  location: string;
  rating: number;
}

interface ProductInfo {
  type: "AGO" | "PMS" | "DPK" | "LPG";
  name: string;
  pricePerLitre: number;
  stockPercentage: number;
}

// Steps
const steps = [
  { id: 1, title: "Product", icon: Package },
  { id: 2, title: "Trucks", icon: Truck },
  { id: 3, title: "Review", icon: CheckCircle2 },
  { id: 4, title: "Payment", icon: CreditCard },
];

// Constants
const PLATFORM_FEE_PER_LITRE = 0.25; // 25 kobo per litre for marketer

// Generate unique ID
const generateId = () => `truck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Product options
const products: ProductInfo[] = [
  { type: "AGO", name: "Automotive Gas Oil (Diesel)", pricePerLitre: 1150, stockPercentage: 78 },
  { type: "PMS", name: "Premium Motor Spirit (Petrol)", pricePerLitre: 890, stockPercentage: 85 },
  { type: "DPK", name: "Dual Purpose Kerosene", pricePerLitre: 1100, stockPercentage: 45 },
];

// Common truck capacities
const truckCapacities = [
  { label: "33,000L (Standard)", value: 33000 },
  { label: "45,000L (Large)", value: 45000 },
  { label: "Custom", value: 0 },
];

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Depot info (from URL params or default)
  const [depot] = useState<DepotInfo>({
    id: searchParams.get("depot") || "depot-001",
    name: searchParams.get("depotName") || "Pinnacle Oil & Gas Terminal",
    location: "Apapa, Lagos",
    rating: 4.8,
  });

  // Selected product
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo>(products[0]);

  // Pickup date
  const [pickupDate, setPickupDate] = useState("");

  // Multiple truck orders
  const [truckOrders, setTruckOrders] = useState<TruckOrder[]>([
    {
      id: generateId(),
      plateNumber: "",
      capacity: 33000,
      quantity: 33000,
      driverName: "",
      driverPhone: "",
      nupengTicket: "",
    },
  ]);

  // Add new truck
  const addTruck = () => {
    setTruckOrders([
      ...truckOrders,
      {
        id: generateId(),
        plateNumber: "",
        capacity: 33000,
        quantity: 33000,
        driverName: "",
        driverPhone: "",
        nupengTicket: "",
      },
    ]);
  };

  // Remove truck
  const removeTruck = (id: string) => {
    if (truckOrders.length > 1) {
      setTruckOrders(truckOrders.filter((t) => t.id !== id));
    }
  };

  // Update truck
  const updateTruck = (id: string, field: keyof TruckOrder, value: string | number) => {
    setTruckOrders(
      truckOrders.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  };

  // Calculations
  const totalQuantity = truckOrders.reduce((sum, t) => sum + t.quantity, 0);
  const productCost = totalQuantity * selectedProduct.pricePerLitre;
  const platformFee = totalQuantity * PLATFORM_FEE_PER_LITRE;
  const grandTotal = productCost + platformFee;

  // Validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!selectedProduct) {
          toast.error("Please select a product");
          return false;
        }
        return true;
      case 2:
        for (const truck of truckOrders) {
          if (!truck.plateNumber.trim()) {
            toast.error("Please enter plate number for all trucks");
            return false;
          }
          if (truck.quantity < 1000) {
            toast.error("Minimum quantity per truck is 1,000 litres");
            return false;
          }
        }
        if (!pickupDate) {
          toast.error("Please select a pickup date");
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Generate order ID
    const orderId = `ORD-${Date.now()}`;

    toast.success(
      <div>
        <p className="font-semibold">Order placed successfully!</p>
        <p className="text-sm">{truckOrders.length} QR code(s) generated</p>
      </div>
    );

    // Redirect to order confirmation
    router.push(`/marketer/orders/${orderId}?success=true&trucks=${truckOrders.length}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketer/depots"
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Place Order</h1>
          <p className="text-slate-500">{depot.name}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-secondary-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm mt-2 font-medium",
                      isCurrent ? "text-secondary-600" : "text-slate-500"
                    )}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-4 rounded-full",
                      currentStep > step.id ? "bg-emerald-500" : "bg-slate-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
      >
        {/* Step 1: Product Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                Select Product
              </h2>
              <p className="text-slate-500 text-sm">
                Choose the petroleum product you want to purchase
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <button
                  key={product.type}
                  onClick={() => setSelectedProduct(product)}
                  className={cn(
                    "p-5 rounded-xl border-2 text-left transition-all relative overflow-hidden",
                    selectedProduct.type === product.type
                      ? "border-secondary-500 bg-secondary-50 shadow-lg"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  {/* Stock indicator bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200">
                    <div
                      className={cn(
                        "h-full transition-all",
                        product.stockPercentage >= 70 && "bg-emerald-500",
                        product.stockPercentage >= 40 && product.stockPercentage < 70 && "bg-amber-500",
                        product.stockPercentage < 40 && "bg-red-500"
                      )}
                      style={{ width: `${product.stockPercentage}%` }}
                    />
                  </div>

                  <Badge
                    variant={selectedProduct.type === product.type ? "secondary" : "default"}
                    className="mb-3"
                  >
                    {product.type}
                  </Badge>
                  <p className="font-semibold text-slate-900 text-sm mb-1">
                    {product.name}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    ₦{formatNumber(product.pricePerLitre)}
                    <span className="text-sm font-normal text-slate-500">/L</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Stock: {product.stockPercentage}%
                  </p>

                  {selectedProduct.type === product.type && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-5 h-5 text-secondary-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Price Info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Current depot price:</span>{" "}
                    ₦{formatNumber(selectedProduct.pricePerLitre)}/litre
                  </p>
                  <p className="text-xs text-slate-500">
                    Price is locked once you proceed to payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Truck Details (Multiple) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Truck Details
                </h2>
                <p className="text-slate-500 text-sm">
                  Add one or more trucks for this order. Each truck gets a unique QR code.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addTruck}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Truck
              </Button>
            </div>

            {/* Trucks List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {truckOrders.map((truck, index) => (
                  <motion.div
                    key={truck.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Truck {index + 1}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Will receive unique QR code
                          </p>
                        </div>
                      </div>
                      {truckOrders.length > 1 && (
                        <button
                          onClick={() => removeTruck(truck.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Plate Number */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Plate Number *
                        </label>
                        <input
                          type="text"
                          value={truck.plateNumber}
                          onChange={(e) =>
                            updateTruck(truck.id, "plateNumber", e.target.value.toUpperCase())
                          }
                          placeholder="ABC-123XY"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent uppercase"
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Quantity (Litres) *
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={
                              truckCapacities.find((c) => c.value === truck.quantity)
                                ? truck.quantity
                                : 0
                            }
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val > 0) {
                                updateTruck(truck.id, "quantity", val);
                                updateTruck(truck.id, "capacity", val);
                              }
                            }}
                            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 bg-white"
                          >
                            {truckCapacities.map((cap) => (
                              <option key={cap.value} value={cap.value}>
                                {cap.label}
                              </option>
                            ))}
                          </select>
                          {!truckCapacities.find((c) => c.value === truck.quantity) && (
                            <input
                              type="number"
                              value={truck.quantity}
                              onChange={(e) =>
                                updateTruck(truck.id, "quantity", parseInt(e.target.value) || 0)
                              }
                              placeholder="Litres"
                              className="w-32 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                              min="1000"
                            />
                          )}
                        </div>
                      </div>

                      {/* Driver Name (Optional) */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Driver Name <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={truck.driverName}
                          onChange={(e) => updateTruck(truck.id, "driverName", e.target.value)}
                          placeholder="Driver's name"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                        />
                      </div>

                      {/* Driver Phone (Optional) */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Driver Phone <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={truck.driverPhone}
                          onChange={(e) => updateTruck(truck.id, "driverPhone", e.target.value)}
                          placeholder="+234 800 000 0000"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                        />
                      </div>

                      {/* NUPENG Ticket (Optional) */}
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          NUPENG Ticket Number <span className="text-slate-400">(Optional - for compliance)</span>
                        </label>
                        <input
                          type="text"
                          value={truck.nupengTicket}
                          onChange={(e) => updateTruck(truck.id, "nupengTicket", e.target.value)}
                          placeholder="NUPENG-2025-XXXXX"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                        />
                      </div>
                    </div>

                    {/* Truck subtotal */}
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-sm text-slate-600">Subtotal for this truck:</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(truck.quantity * selectedProduct.pricePerLitre)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pickup Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Pickup Date *
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-secondary-600" />
                  <span className="font-medium text-secondary-800">
                    {truckOrders.length} truck(s) = {truckOrders.length} QR code(s)
                  </span>
                </div>
                <span className="font-bold text-secondary-800">
                  Total: {formatNumber(totalQuantity)} L
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                Review Your Order
              </h2>
              <p className="text-slate-500 text-sm">
                Please verify all details before proceeding to payment
              </p>
            </div>

            {/* Order Summary */}
            <div className="grid gap-6">
              {/* Depot & Product Info */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4">Order Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Depot</p>
                    <p className="font-medium text-slate-900">{depot.name}</p>
                    <p className="text-sm text-slate-500">{depot.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Product</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{selectedProduct.type}</Badge>
                      <span className="font-medium text-slate-900">
                        ₦{formatNumber(selectedProduct.pricePerLitre)}/L
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Quantity</p>
                    <p className="font-medium text-slate-900">{formatNumber(totalQuantity)} Litres</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Pickup Date</p>
                    <p className="font-medium text-slate-900">
                      {pickupDate ? new Date(pickupDate).toLocaleDateString("en-NG", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trucks Summary */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Trucks ({truckOrders.length})
                </h3>
                <div className="space-y-3">
                  {truckOrders.map((truck, index) => (
                    <div
                      key={truck.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-sm font-bold text-secondary-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{truck.plateNumber || "No plate"}</p>
                          <p className="text-xs text-slate-500">
                            {truck.driverName || "No driver assigned"}
                            {truck.nupengTicket && ` • NUPENG: ${truck.nupengTicket}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatNumber(truck.quantity)} L</p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(truck.quantity * selectedProduct.pricePerLitre)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code Info */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-3">
                  <QrCode className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">
                      {truckOrders.length} Unique QR Code(s) Will Be Generated
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Each truck will receive a unique QR code for verification at the depot. 
                      Share the QR code with your driver for pickup.
                    </p>
                  </div>
                </div>
              </div>

              {/* Escrow Protection */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-800">Escrow Protected</p>
                    <p className="text-sm text-emerald-700">
                      Your payment is held securely and only released to the depot after 
                      loading is confirmed by both parties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                Payment Summary
              </h2>
              <p className="text-slate-500 text-sm">
                Review the breakdown and confirm payment
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-100">
              <div className="space-y-4">
                {/* Product Cost */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">Product Cost</p>
                    <p className="text-sm text-slate-500">
                      {formatNumber(totalQuantity)} L × ₦{formatNumber(selectedProduct.pricePerLitre)}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">{formatCurrency(productCost)}</span>
                </div>

                {/* Platform Fee */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-slate-900">Platform Fee</p>
                      <p className="text-sm text-slate-500">
                        {formatNumber(totalQuantity)} L × ₦0.25
                      </p>
                    </div>
                    <Badge variant="primary" size="sm">Your share</Badge>
                  </div>
                  <span className="font-semibold text-slate-900">{formatCurrency(platformFee)}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-900">Total to Pay</span>
                    <span className="text-2xl font-bold text-secondary-600">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Explanation */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-3">
                <Fuel className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Fair Fee Split</p>
                  <p className="text-sm text-amber-700">
                    You pay <strong>₦0.25/litre</strong> ({formatCurrency(platformFee)}). 
                    The depot also pays ₦0.25/litre from their settlement. 
                    This keeps FuelLink fair for everyone.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Payment Method
              </label>
              <div className="p-4 rounded-xl border-2 border-secondary-500 bg-secondary-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Wallet Balance</p>
                      <p className="text-sm text-slate-500">Available: {formatCurrency(45500000)}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-secondary-500" />
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Important</p>
                  <p className="text-sm text-red-700">
                    By proceeding, you agree to FuelLink&apos;s terms of service. 
                    Funds will be locked in escrow until all trucks complete loading.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 ? (
          <Button variant="outline" size="lg" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        ) : (
          <Link href="/marketer/depots">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </Link>
        )}

        {currentStep < 4 ? (
          <Button variant="secondary" size="lg" onClick={handleNext}>
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Processing..."
          >
            <Shield className="w-5 h-5 mr-2" />
            Confirm & Pay {formatCurrency(grandTotal)}
          </Button>
        )}
      </div>
    </div>
  );
}
export default function NewOrderPage() {
  return (
    <Suspense>
      <NewOrderContent />
    </Suspense>
  );
}
