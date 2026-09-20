// src/app/depot/verification/page.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Package,
  User,
  Search,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

interface VerificationResult {
  success: boolean;
  order?: {
    orderNumber: string;
    customer: string;
    product: string;
    quantity: number;
    amount: number;
    truck: string;
    driver: string;
    status: string;
  };
  error?: string;
}

export default function VerificationPage() {
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleManualVerification = async () => {
    if (!manualCode.trim()) {
      toast.error("Please enter a verification code");
      return;
    }

    setIsVerifying(true);
    setResult(null);

    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock result
    if (manualCode.toLowerCase().includes("valid") || manualCode.length > 10) {
      setResult({
        success: true,
        order: {
          orderNumber: "ORD-2025-001234",
          customer: "Sahara Energy Resources",
          product: "AGO",
          quantity: 33000,
          amount: 37950000,
          truck: "ABC-123XY",
          driver: "Musa Ibrahim",
          status: "confirmed",
        },
      });
      toast.success("Verification successful!");
    } else {
      setResult({
        success: false,
        error: "Invalid verification code. Please check and try again.",
      });
      toast.error("Verification failed");
    }

    setIsVerifying(false);
  };

  const handleStartLoading = async () => {
    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Loading authorized! Proceed to loading bay.");
    setIsVerifying(false);
  };

  const resetVerification = () => {
    setResult(null);
    setManualCode("");
  };

  const recentVerifications = [
    {
      orderNumber: "ORD-2025-001233",
      truck: "DEF-456AB",
      time: "10 mins ago",
      status: "approved",
    },
    {
      orderNumber: "ORD-2025-001232",
      truck: "GHI-789CD",
      time: "25 mins ago",
      status: "approved",
    },
    {
      orderNumber: "ORD-2025-001231",
      truck: "JKL-012EF",
      time: "1 hour ago",
      status: "approved",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QR Verification</h1>
        <p className="text-slate-500">
          Scan or enter the verification code to authorize truck loading
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Scanner */}
        <div className="space-y-6">
          {/* Camera Scanner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Scan QR Code
              </h2>
            </div>
            <div className="p-6">
              {/* Camera View Placeholder */}
              <div
                className={cn(
                  "relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden",
                  isScanning ? "bg-slate-900" : "bg-slate-100"
                )}
              >
                {isScanning ? (
                  <>
                    {/* Simulated camera view */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-secondary-500 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-secondary-500 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-secondary-500 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-secondary-500 rounded-br-lg" />
                        
                        {/* Scanning line animation */}
                        <motion.div
                          className="absolute left-2 right-2 h-0.5 bg-secondary-500"
                          animate={{ y: [0, 180, 0] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      </div>
                    </div>
                    <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
                      Position QR code within the frame
                    </p>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-16 h-16 mb-4" />
                    <p className="text-center px-4">
                      Click the button below to start scanning
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant={isScanning ? "outline" : "primary"}
                size="lg"
                className="w-full mt-6"
                onClick={() => setIsScanning(!isScanning)}
              >
                {isScanning ? (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Start Camera
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Manual Entry */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Manual Entry
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">
                If the QR code is damaged or unreadable, enter the verification
                code manually.
              </p>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Enter verification code..."
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleManualVerification}
                  isLoading={isVerifying}
                >
                  Verify
                </Button>
              </div>

              <p className="text-xs text-slate-400 mt-3">
                Example: FUELLINK-ORD2025001234-VERIFY
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Result & History */}
        <div className="space-y-6">
          {/* Verification Result */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "rounded-2xl shadow-sm border overflow-hidden",
                  result.success
                    ? "bg-success-50 border-success-200"
                    : "bg-danger-50 border-danger-200"
                )}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    {result.success ? (
                      <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-success-600" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-danger-600" />
                      </div>
                    )}
                    <div>
                      <h3
                        className={cn(
                          "text-xl font-bold",
                          result.success ? "text-success-800" : "text-danger-800"
                        )}
                      >
                        {result.success
                          ? "Verification Successful"
                          : "Verification Failed"}
                      </h3>
                      <p
                        className={cn(
                          result.success
                            ? "text-success-600"
                            : "text-danger-600"
                        )}
                      >
                        {result.success
                          ? "This truck is authorized for loading"
                          : result.error}
                      </p>
                    </div>
                  </div>

                  {result.success && result.order && (
                    <div className="bg-white rounded-xl p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Order Number</p>
                          <p className="font-semibold text-slate-900">
                            {result.order.orderNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Customer</p>
                          <p className="font-semibold text-slate-900">
                            {result.order.customer}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Product</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="primary">
                              {result.order.product}
                            </Badge>
                            <span className="text-slate-700">
                              {formatNumber(result.order.quantity)}L
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Amount</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(result.order.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Truck</p>
                          <p className="font-semibold text-slate-900 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            {result.order.truck}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Driver</p>
                          <p className="font-semibold text-slate-900 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {result.order.driver}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="md"
                          className="flex-1"
                          onClick={resetVerification}
                        >
                          New Verification
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          className="flex-1"
                          onClick={handleStartLoading}
                          isLoading={isVerifying}
                        >
                          Authorize Loading
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {!result.success && (
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full mt-4"
                      onClick={resetVerification}
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          {!result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-primary-50 border border-primary-100 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900 mb-2">
                    How to Verify
                  </h3>
                  <ol className="text-sm text-primary-700 space-y-2 list-decimal list-inside">
                    <li>Ask the driver to show their QR code on the app</li>
                    <li>Scan the code using the camera or enter it manually</li>
                    <li>Verify the order details match</li>
                    <li>Authorize loading if everything is correct</li>
                  </ol>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recent Verifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Verifications
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {recentVerifications.map((verification, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {verification.orderNumber}
                      </p>
                      <p className="text-sm text-slate-500">
                        Truck: {verification.truck}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">Approved</Badge>
                    <p className="text-xs text-slate-400 mt-1">
                      {verification.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}