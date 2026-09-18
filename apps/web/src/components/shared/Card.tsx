// src/components/shared/Card.tsx

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outline" | "filled" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      padding = "md",
      hover = false,
      clickable = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-white border border-slate-200 shadow-sm",
      elevated: "bg-white border border-slate-100 shadow-lg",
      outline: "bg-transparent border-2 border-slate-200",
      filled: "bg-slate-50 border border-slate-100",
      glass: "bg-white/80 backdrop-blur-md border border-white/20 shadow-lg",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-200",
          variants[variant],
          paddings[padding],
          hover && "hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5",
          clickable && "cursor-pointer active:scale-[0.99]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-start justify-between gap-4", className)}
        {...props}
      >
        {(title || description) ? (
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
        ) : (
          children
        )}
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

// Card Content
const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));

CardContent.displayName = "CardContent";

// Card Footer
const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-4 pt-4 mt-4 border-t border-slate-100", className)}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";

// Stat Card - For dashboard metrics
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  className?: string;
}

function StatCard({ title, value, change, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  change.type === "increase" && "text-emerald-600",
                  change.type === "decrease" && "text-red-600",
                  change.type === "neutral" && "text-slate-500"
                )}
              >
                {change.type === "increase" && "+"}
                {change.type === "decrease" && "-"}
                {Math.abs(change.value)}%
              </span>
              <span className="text-xs text-slate-400">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
            {icon}
          </div>
        )}
      </div>
      {trend && <div className="mt-4">{trend}</div>}
    </Card>
  );
}

// Price Card - For depot pricing display
interface PriceCardProps {
  productType: "PMS" | "AGO" | "DPK" | "LPG" | "JET_A1";
  price: number;
  previousPrice?: number;
  stockPercentage: number;
  depotName?: string;
  className?: string;
  onClick?: () => void;
}

function PriceCard({
  productType,
  price,
  previousPrice,
  stockPercentage,
  depotName,
  className,
  onClick,
}: PriceCardProps) {
  const priceChange = previousPrice ? price - previousPrice : 0;
  const changePercent = previousPrice ? ((priceChange / previousPrice) * 100).toFixed(2) : "0.00";

  const productColors = {
    PMS: "from-blue-500 to-blue-600",
    AGO: "from-amber-500 to-amber-600",
    DPK: "from-cyan-500 to-cyan-600",
    LPG: "from-purple-500 to-purple-600",
    JET_A1: "from-indigo-500 to-indigo-600",
  };

  const productNames = {
    PMS: "Petrol",
    AGO: "Diesel",
    DPK: "Kerosene",
    LPG: "Cooking Gas",
    JET_A1: "Jet Fuel",
  };

  return (
    <Card
      hover
      clickable={!!onClick}
      onClick={onClick}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Product indicator bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
          productColors[productType]
        )}
      />

      <div className="pt-2">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {productType}
            </span>
            <p className="text-sm text-slate-600">{productNames[productType]}</p>
          </div>
          {/* Stock Level Indicator */}
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    stockPercentage >= 70 && "bg-emerald-500",
                    stockPercentage >= 40 && stockPercentage < 70 && "bg-amber-500",
                    stockPercentage >= 15 && stockPercentage < 40 && "bg-orange-500",
                    stockPercentage < 15 && "bg-red-500"
                  )}
                  style={{ width: `${stockPercentage}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{stockPercentage}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-slate-900">
              ₦{price.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">per litre</p>
          </div>

          {priceChange !== 0 && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                priceChange > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
              )}
            >
              {priceChange > 0 ? "↑" : "↓"}
              ₦{Math.abs(priceChange).toLocaleString()}
              <span className="opacity-60">({changePercent}%)</span>
            </div>
          )}
        </div>

        {depotName && (
          <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 truncate">
            {depotName}
          </p>
        )}
      </div>
    </Card>
  );
}

export { Card, CardHeader, CardContent, CardFooter, StatCard, PriceCard };