// src/app/depot/settings/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  User,
  Bell,
  Shield,
  CreditCard,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Camera,
  Save,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const settingsSections = [
  {
    id: "depot",
    label: "Depot Information",
    icon: Building2,
    description: "Basic depot details and address",
  },
  {
    id: "profile",
    label: "Profile Settings",
    icon: User,
    description: "Your personal account settings",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Email and push notification preferences",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password and two-factor authentication",
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: CreditCard,
    description: "Plan details and billing",
  },
  {
    id: "team",
    label: "Team Members",
    icon: Users,
    description: "Manage staff access",
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("depot");
  const [isSaving, setIsSaving] = useState(false);

  const [depotInfo, setDepotInfo] = useState({
    name: "Pinnacle Oil & Gas Terminal",
    email: "operations@pinnacleoil.com",
    phone: "+234 801 234 5678",
    address: "Plot 15, Apapa Tank Farm Complex, Apapa",
    state: "Lagos",
    lga: "Apapa",
    operatingHours: "24/7",
    description:
      "Premium petroleum depot offering AGO, PMS, and DPK with 24/7 operations and fast loading times.",
  });

  const [notifications, setNotifications] = useState({
    emailNewOrder: true,
    emailOrderComplete: true,
    emailLowStock: true,
    emailPayment: true,
    pushNewOrder: true,
    pushOrderComplete: false,
    pushLowStock: true,
    pushPayment: true,
    smsNewOrder: false,
    smsPayment: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Settings saved successfully!");
    setIsSaving(false);
  };

  const renderDepotSection = () => (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Depot Logo
        </label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600">
            <Building2 className="w-10 h-10" />
          </div>
          <div>
            <Button variant="outline" size="sm">
              <Camera className="w-4 h-4 mr-2" />
              Upload Logo
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              PNG, JPG up to 2MB. Recommended: 200x200px
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Depot Name
          </label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={depotInfo.name}
              onChange={(e) =>
                setDepotInfo({ ...depotInfo, name: e.target.value })
              }
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              value={depotInfo.email}
              onChange={(e) =>
                setDepotInfo({ ...depotInfo, email: e.target.value })
              }
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="tel"
              value={depotInfo.phone}
              onChange={(e) =>
                setDepotInfo({ ...depotInfo, phone: e.target.value })
              }
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Operating Hours
          </label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={depotInfo.operatingHours}
              onChange={(e) =>
                setDepotInfo({ ...depotInfo, operatingHours: e.target.value })
              }
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              <option value="24/7">24/7</option>
              <option value="6am-10pm">6:00 AM - 10:00 PM</option>
              <option value="6am-6pm">6:00 AM - 6:00 PM</option>
              <option value="custom">Custom Hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Address
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
          <textarea
            value={depotInfo.address}
            onChange={(e) =>
              setDepotInfo({ ...depotInfo, address: e.target.value })
            }
            rows={3}
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* State & LGA */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            State
          </label>
          <select
            value={depotInfo.state}
            onChange={(e) =>
              setDepotInfo({ ...depotInfo, state: e.target.value })
            }
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="Lagos">Lagos</option>
            <option value="Rivers">Rivers</option>
            <option value="Delta">Delta</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            LGA
          </label>
          <input
            type="text"
            value={depotInfo.lga}
            onChange={(e) =>
              setDepotInfo({ ...depotInfo, lga: e.target.value })
            }
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Depot Description
        </label>
        <textarea
          value={depotInfo.description}
          onChange={(e) =>
            setDepotInfo({ ...depotInfo, description: e.target.value })
          }
          rows={4}
          placeholder="Describe your depot, products, and services..."
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-slate-500 mt-2">
          This description will be visible to marketers browsing depots.
        </p>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-8">
      {/* Email Notifications */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-slate-400" />
          Email Notifications
        </h3>
        <div className="space-y-4">
          {[
            { key: "emailNewOrder", label: "New order received" },
            { key: "emailOrderComplete", label: "Order completed" },
            { key: "emailLowStock", label: "Low stock alerts" },
            { key: "emailPayment", label: "Payment received" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-700">{item.label}</span>
              <input
                type="checkbox"
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    [item.key]: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-400" />
          Push Notifications
        </h3>
        <div className="space-y-4">
          {[
            { key: "pushNewOrder", label: "New order received" },
            { key: "pushOrderComplete", label: "Order completed" },
            { key: "pushLowStock", label: "Low stock alerts" },
            { key: "pushPayment", label: "Payment received" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-700">{item.label}</span>
              <input
                type="checkbox"
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    [item.key]: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* SMS Notifications */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-slate-400" />
          SMS Notifications
        </h3>
        <div className="space-y-4">
          {[
            { key: "smsNewOrder", label: "New order received" },
            { key: "smsPayment", label: "Payment received" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <span className="text-slate-700">{item.label}</span>
              <input
                type="checkbox"
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    [item.key]: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSubscriptionSection = () => (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge className="bg-white/20 text-white mb-2">Current Plan</Badge>
            <h3 className="text-2xl font-bold">Enterprise</h3>
            <p className="text-white/80">₦400,000/month</p>
          </div>
          <Badge className="bg-white text-primary-600">Active</Badge>
        </div>
        <p className="text-white/70 mb-4">
          Next billing date: March 1, 2025
        </p>
        <div className="flex gap-3">
          <Button variant="white" size="sm">
            Change Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Cancel Subscription
          </Button>
        </div>
      </div>

      {/* Plan Features */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Plan Features</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Unlimited tank tracking",
            "Full API access",
            "Custom integrations",
            "Dedicated account manager",
            "24/7 priority support",
            "Custom branding",
            "Advanced analytics",
            "SLA guarantee",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-success-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-slate-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Billing History</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { date: "Feb 1, 2025", amount: 400000, status: "paid" },
            { date: "Jan 1, 2025", amount: 400000, status: "paid" },
            { date: "Dec 1, 2024", amount: 400000, status: "paid" },
          ].map((invoice, index) => (
            <div
              key={index}
              className="p-4 flex items-center justify-between hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{invoice.date}</p>
                <p className="text-sm text-slate-500">Enterprise Plan</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  ₦{invoice.amount.toLocaleString()}
                </p>
                <Badge variant="success" size="sm">
                  Paid
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "depot":
        return renderDepotSection();
      case "notifications":
        return renderNotificationsSection();
      case "subscription":
        return renderSubscriptionSection();
      default:
        return (
          <div className="py-12 text-center text-slate-500">
            <p>Section under development</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500">
            Manage your depot settings and preferences
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                  activeSection === section.id
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <section.icon
                  className={cn(
                    "w-5 h-5",
                    activeSection === section.id
                      ? "text-primary-500"
                      : "text-slate-400"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{section.label}</p>
                  <p className="text-xs text-slate-500 truncate hidden sm:block">
                    {section.description}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4",
                    activeSection === section.id
                      ? "text-primary-500"
                      : "text-slate-300"
                  )}
                />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          {renderSectionContent()}
        </motion.div>
      </div>
    </div>
  );
}