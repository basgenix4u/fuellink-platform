// src/components/shared/Badge.tsx

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "outline"
    | "stock-high"
    | "stock-medium"
    | "stock-low"
    | "stock-critical";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}

export function Badge({
  variant = "default",
  size = "md",
  children,
  className,
  dot = false,
  pulse = false,
  icon,
}: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    primary: "bg-primary-50 text-primary-700 border border-primary-200",
    secondary: "bg-secondary-50 text-secondary-700 border border-secondary-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    outline: "bg-transparent border border-slate-300 text-slate-600",
    // Stock level variants
    "stock-high": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "stock-medium": "bg-amber-50 text-amber-700 border border-amber-200",
    "stock-low": "bg-orange-50 text-orange-700 border border-orange-200",
    "stock-critical": "bg-red-50 text-red-700 border border-red-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const dotColors = {
    default: "bg-slate-500",
    primary: "bg-primary-500",
    secondary: "bg-secondary-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    outline: "bg-slate-500",
    "stock-high": "bg-emerald-500",
    "stock-medium": "bg-amber-500",
    "stock-low": "bg-orange-500",
    "stock-critical": "bg-red-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            dotColors[variant],
            pulse && "animate-pulse"
          )}
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Stock Level Badge - Specific component for tank capacity
interface StockLevelBadgeProps {
  percentage: number; // 0-100
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  className?: string;
}

export function StockLevelBadge({
  percentage,
  size = "md",
  showPercentage = true,
  className,
}: StockLevelBadgeProps) {
  const getVariant = (pct: number) => {
    if (pct >= 70) return "stock-high";
    if (pct >= 40) return "stock-medium";
    if (pct >= 15) return "stock-low";
    return "stock-critical";
  };

  const getLabel = (pct: number) => {
    if (pct >= 70) return "High Stock";
    if (pct >= 40) return "Medium";
    if (pct >= 15) return "Low Stock";
    return "Critical";
  };

  const variant = getVariant(percentage);

  return (
    <Badge variant={variant} size={size} dot pulse={percentage < 15} className={className}>
      {getLabel(percentage)}
      {showPercentage && (
        <span className="ml-1 opacity-75">({Math.round(percentage)}%)</span>
      )}
    </Badge>
  );
}

// Order Status Badge
interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OrderStatusBadge({ status, size = "md", className }: OrderStatusBadgeProps) {
  const statusConfig: Record<string, { variant: BadgeProps["variant"]; label: string; dot?: boolean; pulse?: boolean }> = {
    pending: { variant: "warning", label: "Pending", dot: true },
    confirmed: { variant: "primary", label: "Confirmed", dot: true },
    "payment-locked": { variant: "secondary", label: "Payment Locked", dot: true, pulse: true },
    "ready-for-pickup": { variant: "primary", label: "Ready for Pickup", dot: true },
    "in-transit": { variant: "warning", label: "In Transit", dot: true, pulse: true },
    "at-depot": { variant: "secondary", label: "At Depot", dot: true },
    loading: { variant: "warning", label: "Loading", dot: true, pulse: true },
    loaded: { variant: "success", label: "Loaded", dot: true },
    completed: { variant: "success", label: "Completed" },
    cancelled: { variant: "danger", label: "Cancelled" },
    disputed: { variant: "danger", label: "Disputed", dot: true, pulse: true },
  };

  const config = statusConfig[status] || { variant: "default", label: status };

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={config.dot}
      pulse={config.pulse}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

// Verification Badge
interface VerificationBadgeProps {
  isVerified: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerificationBadge({ isVerified, size = "sm", className }: VerificationBadgeProps) {
  if (!isVerified) return null;

  return (
    <Badge variant="success" size={size} className={className}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </Badge>
  );
}

// Product Type Badge
interface ProductBadgeProps {
  type: "PMS" | "AGO" | "DPK" | "LPG" | "JET_A1";
  size?: "sm" | "md" | "lg";
  showFullName?: boolean;
  className?: string;
}

export function ProductBadge({ type, size = "md", showFullName = false, className }: ProductBadgeProps) {
  const productConfig: Record<string, { color: string; bg: string; border: string; name: string; shortName: string }> = {
    PMS: {
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
      name: "Premium Motor Spirit",
      shortName: "Petrol",
    },
    AGO: {
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      name: "Automotive Gas Oil",
      shortName: "Diesel",
    },
    DPK: {
      color: "text-cyan-700",
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      name: "Dual Purpose Kerosene",
      shortName: "Kerosene",
    },
    LPG: {
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
      name: "Liquefied Petroleum Gas",
      shortName: "LPG",
    },
    JET_A1: {
      color: "text-indigo-700",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      name: "Aviation Fuel",
      shortName: "Jet A1",
    },
  };

  const config = productConfig[type];
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold rounded-full border",
        config.color,
        config.bg,
        config.border,
        sizes[size],
        className
      )}
    >
      {type}
      {showFullName && <span className="font-medium opacity-75">• {config.shortName}</span>}
    </span>
  );
}