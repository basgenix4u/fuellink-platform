// src/components/marketer/FloatingFleetForm.tsx

"use client";

import { useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { Truck, User, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface FloatingFleetFormProps {
  type: "truck" | "driver" | null;
  onClose: () => void;
}

export function FloatingFleetForm({ type, onClose }: FloatingFleetFormProps) {
  const dragControls = useDragControls();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!type) return null;

  const handleSubmit = () => {
    toast.success(`New ${type} added successfully!`);
    onClose();
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "fixed z-50 bg-white rounded-2xl shadow-2xl border-2 border-slate-100 overflow-hidden",
        isMinimized ? "w-64" : "w-80"
      )}
      style={{ top: 100, right: 20 }} // Top right positioning
    >
      {/* Header */}
      <div 
        className="bg-secondary-600 p-3 flex items-center justify-between cursor-move"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 text-white">
          {type === "truck" ? <Truck className="w-4 h-4" /> : <User className="w-4 h-4" />}
          <span className="font-semibold text-sm capitalize">Add {type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded text-white"
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      {!isMinimized && (
        <div className="p-4 space-y-3">
          {type === "truck" ? (
            <>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Plate Number</label>
                <input className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-secondary-500 outline-none" placeholder="ABC-123XY" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Capacity (L)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-secondary-500 outline-none" placeholder="33000" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Type</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-secondary-500 outline-none">
                  <option>Tanker</option>
                  <option>Trailer</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Full Name</label>
                <input className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-secondary-500 outline-none" placeholder="Driver Name" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Phone</label>
                <input type="tel" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-secondary-500 outline-none" placeholder="080..." />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">License No.</label>
                <input className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-secondary-500 outline-none" placeholder="License ID" />
              </div>
            </>
          )}

          <Button size="sm" variant="secondary" className="w-full mt-2" onClick={handleSubmit}>
            Save {type === "truck" ? "Truck" : "Driver"}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
