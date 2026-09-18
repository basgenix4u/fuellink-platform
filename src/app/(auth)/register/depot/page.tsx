// src/app/(auth)/register/depot/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Fuel,
  FileText,
  Factory,
  Plus,
  Trash2,
  Database, // Icon for Tank
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Nigerian states
const depotStates = [
  "Lagos", "Rivers", "Delta", "Cross River", "Akwa Ibom", "Edo", "Ogun", "Ondo"
];

const productTypes = ["PMS", "AGO", "DPK", "LPG", "ATK"];

interface TankConfig {
  id: string;
  name: string;
  product: string;
  capacity: number;
}

export default function DepotRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    depotName: "",
    address: "",
    state: "",
    licenseNumber: "", // NMDPRA License
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  // Tank State
  const [tanks, setTanks] = useState<TankConfig[]>([
    { id: "1", name: "Tank 1", product: "PMS", capacity: 0 }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-expect-error — `checked` exists only on HTMLInputElement, not on the select half of the union
    const checked = e.target.checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Tank Management Functions
  const addTank = () => {
    setTanks([
      ...tanks, 
      { id: Date.now().toString(), name: `Tank ${tanks.length + 1}`, product: "PMS", capacity: 0 }
    ]);
  };

  const removeTank = (id: string) => {
    if (tanks.length > 1) {
      setTanks(tanks.filter(t => t.id !== id));
    }
  };

  const updateTank = (id: string, field: keyof TankConfig, value: string | number) => {
    setTanks(tanks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        if (!formData.depotName || !formData.address || !formData.state || !formData.licenseNumber) {
          toast.error("Please fill in all depot details");
          return false;
        }
        // Validate tanks
        for (const tank of tanks) {
          if (tank.capacity <= 0) {
            toast.error(`Please enter valid capacity for ${tank.name}`);
            return false;
          }
        }
        return true;
      case 2:
        if (!formData.contactName || !formData.contactEmail || !formData.contactPhone) {
          toast.error("Please fill in all contact details");
          return false;
        }
        return true;
      case 3:
        if (!formData.password || formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return false;
        }
        if (!formData.agreeToTerms) {
          toast.error("You must agree to the Terms of Service");
          return false;
        }
        return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success("Depot registration submitted for verification!");
    router.push("/depot"); // Or separate 'pending verification' page
    setIsLoading(false);
  };

  const steps = [
    { number: 1, title: "Facility Details", icon: Factory },
    { number: 2, title: "Contact Person", icon: User },
    { number: 3, title: "Security", icon: Lock },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Side Branding (Same as before...) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 relative overflow-hidden">
        {/* ... (Branding content) ... */}
        <div className="relative z-10 flex flex-col justify-center px-20">
          <Logo variant="white" size="lg" />
          <h1 className="text-5xl font-bold text-white mt-10 mb-6">Partner with FuelLink</h1>
          <p className="text-xl text-white/80">Streamline your depot operations with verified digital transactions.</p>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto">
          {/* Header & Steps */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Register Depot Facility</h1>
            <p className="text-slate-500">Step {step} of 3: {steps[step-1].title}</p>
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", step >= s.number ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-500")}>
                  {step > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                </div>
                {idx < steps.length - 1 && <div className={cn("w-12 h-1 mx-2 rounded-full", step > s.number ? "bg-primary-600" : "bg-slate-200")} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: FACILITY & TANKS */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Depot Name *</label>
                    <input type="text" name="depotName" value={formData.depotName} onChange={handleInputChange} className="w-full mt-1 p-3 border rounded-xl" placeholder="e.g. Pinnacle Oil Terminal" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">NMDPRA License No. *</label>
                    <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} className="w-full mt-1 p-3 border rounded-xl" placeholder="LCN-2025-XXXX" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Address</label>
                      <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full mt-1 p-3 border rounded-xl" placeholder="Depot Address" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">State</label>
                      <select name="state" value={formData.state} onChange={handleInputChange} className="w-full mt-1 p-3 border rounded-xl bg-white">
                        <option value="">Select</option>
                        {depotStates.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tank Configuration */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Database className="w-4 h-4 text-primary-500" /> Tank Configuration
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={addTank} leftIcon={<Plus className="w-4 h-4" />}>
                      Add Tank
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence>
                      {tanks.map((tank, index) => (
                        <motion.div 
                          key={tank.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative"
                        >
                          {tanks.length > 1 && (
                            <button type="button" onClick={() => removeTank(tank.id)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-4">
                              <label className="text-xs text-slate-500 mb-1 block">Tank Name</label>
                              <input 
                                type="text" 
                                value={tank.name}
                                onChange={(e) => updateTank(tank.id, "name", e.target.value)}
                                className="w-full p-2 text-sm border rounded-lg"
                                placeholder="Tank A"
                              />
                            </div>
                            <div className="col-span-4">
                              <label className="text-xs text-slate-500 mb-1 block">Product</label>
                              <select 
                                value={tank.product}
                                onChange={(e) => updateTank(tank.id, "product", e.target.value)}
                                className="w-full p-2 text-sm border rounded-lg bg-white"
                              >
                                {productTypes.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div className="col-span-4">
                              <label className="text-xs text-slate-500 mb-1 block">Capacity (Litres)</label>
                              <input 
                                type="number" 
                                value={tank.capacity || ""}
                                onChange={(e) => updateTank(tank.id, "capacity", parseInt(e.target.value) || 0)}
                                className="w-full p-2 text-sm border rounded-lg"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Steps 2 & 3 remain mostly the same (Contact & Password) - keeping brevity */}
            {step === 2 && (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                 {/* Contact fields inputs... */}
                 <div><label className="text-sm font-medium">Contact Name</label><input name="contactName" onChange={handleInputChange} className="w-full mt-1 p-3 border rounded-xl" /></div>
                 <div><label className="text-sm font-medium">Email</label><input name="contactEmail" onChange={handleInputChange} className="w-full mt-1 p-3 border rounded-xl" /></div>
                 <div><label className="text-sm font-medium">Phone</label><input name="contactPhone" onChange={handleInputChange} className="w-full mt-1 p-3 border rounded-xl" /></div>
               </motion.div>
            )}

            {step === 3 && (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                 {/* Password fields... */}
                 <div><label className="text-sm font-medium">Password</label><input type="password" name="password" onChange={handleInputChange} className="w-full mt-1 p-3 border rounded-xl" /></div>
                 <div><label className="text-sm font-medium">Confirm</label><input type="password" name="confirmPassword" onChange={handleInputChange} className="w-full mt-1 p-3 border rounded-xl" /></div>
                 <div className="flex items-center gap-2"><input type="checkbox" name="agreeToTerms" onChange={handleInputChange} /> <span>Agree to Terms</span></div>
               </motion.div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 pt-6">
              {step > 1 && <Button type="button" variant="outline" size="lg" onClick={handleBack}>Back</Button>}
              {step < 3 ? (
                <Button type="button" variant="primary" size="lg" fullWidth onClick={handleNext}>Continue</Button>
              ) : (
                <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>Submit Registration</Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}