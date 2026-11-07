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
      default: "bg-white border border-[var(--hairline)] shadow-[var(--shadow-panel)]",
      elevated: "bg-white border border-[var(--hairline)] shadow-[var(--shadow-raised)]",
      outline: "bg-transparent border border-[var(--hairline-strong)]",
      filled: "bg-[#f7f8f7] border border-[var(--hairline)]",
      glass: "bg-white/75 backdrop-blur-xl border border-white/40 shadow-[var(--shadow-raised)]",
    };

    const paddings = {
      none: "",
      sm: "p-3.5",
      md: "p-5",
      lg: "p-7",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[18px] transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          variants[variant],
          paddings[padding],
          hover && "hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] hover:border-[var(--hairline-strong)]",
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
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-slate-900">{title}</h3>
            )}
            {description && (
              <p className="text-[12.5px] text-slate-500">{description}</p>
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
          <p className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-slate-400">{title}</p>
          <p className="stat-value text-[26px] text-slate-900">{value}</p>
          {change && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "delta-pill",
                  change.type === "increase" && "text-emerald-600",
                  change.type === "decrease" && "text-red-600",
                  change.type === "neutral" && "text-slate-500"
                )}
              >
                {change.type === "increase" && "+"}
                {change.type === "decrease" && "-"}
                {Math.abs(change.value)}%
              </span>
              <span className="text-[11px] text-slate-400">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-primary-50 p-2.5 text-primary-600 ring-1 ring-primary-100">
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