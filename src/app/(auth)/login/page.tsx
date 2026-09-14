// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  ShoppingCart,
  Shield,
  CheckCircle2,
  TrendingUp,
  Users,
  Bot,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type UserRole = "depot" | "marketer";

const roleOptions: {
  id: UserRole;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: "marketer",
    label: "Marketer",
    icon: ShoppingCart,
    description: "Buy petroleum products",
  },
  {
    id: "depot",
    label: "Depot Owner",
    icon: Building2,
    description: "Sell & manage inventory",
  },
];

const stats = [
  { value: "127+", label: "Active Depots", icon: Building2 },
  { value: "₦58B+", label: "Transaction Volume", icon: TrendingUp },
  { value: "3,400+", label: "Marketers", icon: Users },
];

// Updated features — no per-litre fee mention
const features = [
  "AI chatbot handles depot inquiries 24/7",
  "Voice notes in Hausa, Yoruba, Igbo — transcribed by AI",
  "Live refinery prices from NNPCL, Dangote & more",
  "Secured payments via Providus Bank escrow",
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("marketer");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Welcome back! Redirecting to your dashboard...");

    setTimeout(() => {
      router.push(selectedRole === "depot" ? "/depot" : "/marketer");
    }, 500);

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-secondary-500/20 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 2xl:px-20 w-full">
          <Logo variant="white" size="lg" showTagline className="mb-12" />

          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold text-white leading-tight mb-6">
            Nigeria&apos;s AI-Powered
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-accent-400">
              Petroleum Exchange
            </span>
          </h1>

          <p className="text-lg xl:text-xl text-white/80 mb-10 leading-relaxed max-w-lg">
            AI chatbots, verified stock, and secure Providus Bank payments.
            Join thousands of traders already on FuelLink.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 xl:gap-6 mb-10">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 xl:p-5 border border-white/10"
              >
                <stat.icon className="w-6 h-6 text-secondary-400 mb-2" />
                <div className="text-2xl xl:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* AI feature callout */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Bot className="w-5 h-5 text-secondary-400" />
              <span className="text-white font-semibold text-sm">New: AI Depot Chat</span>
            </div>
            <p className="text-white/70 text-sm">
              Chat with any depot in Hausa, Yoruba, or English. Voice notes are auto-transcribed.
              AI responds 24/7 — even at 3am.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="w-5 h-5 text-secondary-400 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 text-white/50">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Secured by Providus Bank • NMDPRA Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Logo variant="default" size="lg" className="justify-center mb-4" />
            <p className="text-slate-500">Nigeria&apos;s AI-Powered Petroleum Exchange</p>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-600">Sign in to your FuelLink account</p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    "relative flex flex-col items-center p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200",
                    selectedRole === role.id
                      ? role.id === "marketer"
                        ? "border-secondary-500 bg-secondary-50 shadow-lg shadow-secondary-500/10"
                        : "border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
                      selectedRole === role.id
                        ? role.id === "marketer"
                          ? "bg-secondary-500 text-white"
                          : "bg-primary-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <role.icon className="w-6 h-6" />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      selectedRole === role.id ? "text-slate-900" : "text-slate-700"
                    )}
                  >
                    {role.label}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">{role.description}</span>

                  {selectedRole === role.id && (
                    <motion.div
                      layoutId="activeRoleIndicator"
                      className={cn(
                        "absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-lg",
                        role.id === "marketer" ? "bg-secondary-500" : "bg-primary-500"
                      )}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500 transition-colors"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant={selectedRole === "marketer" ? "secondary" : "primary"}
              size="lg"
              fullWidth
              isLoading={isLoading}
              loadingText="Signing in..."
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Sign In as {selectedRole === "marketer" ? "Marketer" : "Depot Owner"}
            </Button>
          </form>

          <p className="text-center mt-8 text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href={`/register/${selectedRole}`}
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}