// src/app/(auth)/register/marketer/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building,
  ArrowRight,
  ArrowLeft,
  MapPin,
  FileText,
  Shield,
  CheckCircle2,
  Fuel,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Nigerian states
const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export default function MarketerRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    fullName: "",
    email: "",
    phone: "",
    // Step 2: Business Info
    businessName: "",
    businessAddress: "",
    state: "",
    rcNumber: "", // Optional CAC registration
    // Step 3: Security
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone) {
          toast.error("Please fill in all required fields");
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        if (!/^(\+234|0)[789]\d{9}$/.test(formData.phone.replace(/\s/g, ""))) {
          toast.error("Please enter a valid Nigerian phone number");
          return false;
        }
        return true;
      case 2:
        if (!formData.businessName || !formData.state) {
          toast.error("Please fill in all required fields");
          return false;
        }
        return true;
      case 3:
        if (!formData.password || !formData.confirmPassword) {
          toast.error("Please fill in all password fields");
          return false;
        }
        if (formData.password.length < 8) {
          toast.error("Password must be at least 8 characters");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return false;
        }
        if (!formData.agreeToTerms) {
          toast.error("You must agree to the Terms of Service");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    setIsLoading(true);

    // Simulate registration API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("Account created successfully! Welcome to FuelLink.");

    setTimeout(() => {
      router.push("/marketer");
    }, 500);

    setIsLoading(false);
  };

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Business Info", icon: Building },
    { number: 3, title: "Security", icon: Lock },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <Logo variant="white" size="lg" showTagline className="mb-12" />

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Start Buying Petroleum Products with Confidence
          </h1>

          <p className="text-xl text-white/80 mb-10 leading-relaxed">
            Join thousands of marketers who are saving time and money with 
            real-time pricing and secure transactions.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: CheckCircle2, text: "Access real-time depot prices across Nigeria" },
              { icon: Shield, text: "Secure escrow protection on all transactions" },
              { icon: Fuel, text: "Only ₦0.25/litre platform fee" },
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <benefit.icon className="w-4 h-4" />
                </div>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 bg-white border-b border-slate-100">
          <Logo variant="default" size="md" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-2xl mb-4">
                <ShoppingCart className="w-8 h-8 text-secondary-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Create Marketer Account
              </h1>
              <p className="text-slate-600">
                Step {step} of 3: {steps[step - 1].title}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, idx) => (
                <div key={s.number} className="flex items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                      step > s.number
                        ? "bg-green-500 text-white"
                        : step === s.number
                        ? "bg-secondary-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {step > s.number ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <s.icon className="w-5 h-5" />
                    )}
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-12 h-1 mx-2 rounded-full transition-all",
                        step > s.number ? "bg-green-500" : "bg-slate-200"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Business Info */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Business Name *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="Your Business Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Business Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="123 Business Street"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      State *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent appearance-none"
                      >
                        <option value="">Select State</option>
                        {nigerianStates.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CAC Registration Number (Optional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="rcNumber"
                        value={formData.rcNumber}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="RC 123456"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Adding your CAC number helps verify your business
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Security */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Minimum 8 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="bg-slate-100 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        className="w-5 h-5 mt-0.5 rounded border-slate-300 text-secondary-500 focus:ring-secondary-500"
                      />
                      <span className="text-sm text-slate-600">
                        I agree to FuelLink&apos;s{" "}
                        <Link href="/terms" className="text-secondary-600 hover:underline font-medium">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-secondary-600 hover:underline font-medium">
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  </div>

                  {/* Fee Reminder */}
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Fuel className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Platform Fee: ₦0.25 per litre
                        </p>
                        <p className="text-xs text-green-600">
                          Only pay when you transact. No hidden fees.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleBack}
                    leftIcon={<ArrowLeft className="w-5 h-5" />}
                  >
                    Back
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={handleNext}
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    loadingText="Creating account..."
                    rightIcon={<CheckCircle2 className="w-5 h-5" />}
                  >
                    Create Account
                  </Button>
                )}
              </div>
            </form>

            {/* Switch to Depot Registration */}
            <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Are you a Depot Owner?{" "}
                <Link
                  href="/register/depot"
                  className="font-semibold text-primary-600 hover:text-primary-700"
                >
                  Register here instead
                </Link>
              </p>
            </div>

            {/* Login Link */}
            <p className="text-center mt-6 text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}