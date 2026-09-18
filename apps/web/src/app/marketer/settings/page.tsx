// src/app/marketer/settings/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Building,
  Bell,
  Shield,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Save,
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User, description: "Your account details" },
  { id: "business", label: "Business", icon: Building, description: "Business information" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alert preferences" },
  { id: "security", label: "Security", icon: Shield, description: "Password & security" },
  { id: "billing", label: "Billing", icon: CreditCard, description: "Payment methods" },
];

export default function MarketerSettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Alhaji Musa Abdullahi",
    email: "musa@saharaenergy.ng",
    phone: "+234 802 345 6789",
  });

  const [business, setBusiness] = useState({
    businessName: "Sahara Energy Resources",
    address: "15 Industrial Avenue, Ikeja, Lagos",
    state: "Lagos",
    rcNumber: "RC-123456",
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailPrices: true,
    emailPayments: true,
    pushOrders: true,
    pushPrices: false,
    pushPayments: true,
    smsPrices: true,
    smsOrders: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Settings saved successfully!");
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage your account preferences</p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleSave}
          isLoading={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                  activeSection === section.id
                    ? "bg-secondary-50 text-secondary-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <section.icon
                  className={cn(
                    "w-5 h-5",
                    activeSection === section.id
                      ? "text-secondary-500"
                      : "text-slate-400"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{section.label}</p>
                  <p className="text-xs text-slate-500 truncate hidden sm:block">
                    {section.description}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4",
                    activeSection === section.id
                      ? "text-secondary-500"
                      : "text-slate-300"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 text-3xl font-bold">
                      {profile.fullName.charAt(0)}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50">
                      <Camera className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Upload Photo</Button>
                    <p className="text-xs text-slate-500 mt-2">JPG or PNG. Max 2MB.</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
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
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
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
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Business Section */}
            {activeSection === "business" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Business Information</h2>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Business Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={business.businessName}
                        onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                      <textarea
                        value={business.address}
                        onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500 resize-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      State
                    </label>
                    <select
                      value={business.state}
                      onChange={(e) => setBusiness({ ...business, state: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    >
                      <option>Lagos</option>
                      <option>Rivers</option>
                      <option>Ogun</option>
                      <option>Kano</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      RC Number
                    </label>
                    <input
                      type="text"
                      value={business.rcNumber}
                      onChange={(e) => setBusiness({ ...business, rcNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-slate-400" />
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: "emailOrders", label: "Order updates" },
                        { key: "emailPrices", label: "Price alerts" },
                        { key: "emailPayments", label: "Payment confirmations" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between p-4 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100"
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
                            className="w-5 h-5 rounded border-slate-300 text-secondary-500 focus:ring-secondary-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-slate-400" />
                      Push Notifications
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: "pushOrders", label: "Order updates" },
                        { key: "pushPrices", label: "Price drops" },
                        { key: "pushPayments", label: "Payment received" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between p-4 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100"
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
                            className="w-5 h-5 rounded border-slate-300 text-secondary-500 focus:ring-secondary-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-slate-400" />
                      SMS Notifications
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: "smsPrices", label: "Price alerts" },
                        { key: "smsOrders", label: "Order confirmations" },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between p-4 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100"
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
                            className="w-5 h-5 rounded border-slate-300 text-secondary-500 focus:ring-secondary-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Security Settings</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-500"
                    />
                  </div>

                  <Button variant="secondary" size="md">
                    Update Password
                  </Button>
                </div>

                {/* Two-Factor */}
                <div className="pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <h3 className="font-medium text-slate-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-slate-500">Add extra security to your account</p>
                    </div>
                    <Badge variant="warning">Not Enabled</Badge>
                  </div>
                  <Button variant="outline" size="md" className="mt-4">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            )}

            {/* Billing Section */}
            {activeSection === "billing" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Billing & Payments</h2>

                <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-100">
                  <p className="text-sm text-secondary-700">
                    Your transactions are processed securely through our escrow system. No subscription fees for marketers.
                  </p>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="font-medium text-slate-900 mb-4">Saved Payment Methods</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">•••• •••• •••• 4242</p>
                          <p className="text-sm text-slate-500">Expires 12/2026</p>
                        </div>
                      </div>
                      <Badge variant="success">Default</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="md" className="mt-4">
                    Add Payment Method
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
