// src/components/shared/Logo.tsx

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "white" | "dark";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export function Logo({
  variant = "default",
  size = "md",
  showText = true,
  showTagline = false,
  className,
  href = "/",
  onClick,
}: LogoProps) {
  const sizeClasses = {
    xs: "h-6",
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-16",
  };

  const textSizeClasses = {
    xs: "text-base",
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const colorClasses = {
    default: "text-primary-500",
    white: "text-white",
    dark: "text-slate-900",
  };

  // Plain JSX value (not a nested component) so identity is stable across renders
  const logoContent = (
    <>
      {/* Logo Icon */}
      <div className={cn("relative flex-shrink-0", sizeClasses[size])}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("h-full w-auto", colorClasses[variant])}
        >
          {/* Fuel Drop Shape */}
          <path
            d="M24 4C24 4 8 20 8 30C8 38.8366 15.1634 46 24 46C32.8366 46 40 38.8366 40 30C40 20 24 4 24 4Z"
            fill="currentColor"
          />
          {/* Inner Highlight */}
          <path
            d="M24 10C24 10 14 22 14 29C14 35.0751 18.9249 40 24 40C29.0751 40 34 35.0751 34 29C34 22 24 10 24 10Z"
            fill={variant === "white" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)"}
          />
          {/* Link/Connection Symbol */}
          <g>
            <path
              d="M18 28C18 28 20 32 24 32C28 32 30 28 30 28"
              stroke={variant === "white" ? "#0D5C2F" : "white"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle
              cx="20"
              cy="24"
              r="2"
              fill={variant === "white" ? "#0D5C2F" : "white"}
            />
            <circle
              cx="28"
              cy="24"
              r="2"
              fill={variant === "white" ? "#0D5C2F" : "white"}
            />
            <path
              d="M22 24H26"
              stroke={variant === "white" ? "#0D5C2F" : "white"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
          {/* Orange Accent - Energy/Live indicator */}
          <circle cx="38" cy="10" r="5" fill="#FF8C00" />
          <circle cx="38" cy="10" r="3" fill="#FFB84D" />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className={cn(
              "font-bold tracking-tight leading-none",
              textSizeClasses[size],
              colorClasses[variant]
            )}
          >
            Fuel<span className="text-secondary-500">Link</span>
          </span>
          {showTagline && (size === "lg" || size === "xl") && (
            <span
              className={cn(
                "text-[10px] uppercase tracking-[0.2em] mt-1 font-medium",
                variant === "white" ? "text-white/60" : "text-slate-400"
              )}
            >
              Digital Exchange
            </span>
          )}
        </div>
      )}
    </>
  );

  const containerClasses = cn(
    "flex items-center gap-2 transition-opacity hover:opacity-90",
    className
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={containerClasses}>
        {logoContent}
      </button>
    );
  }

  return (
    <Link href={href} className={containerClasses}>
      {logoContent}
    </Link>
  );
}

// Favicon/Small icon version for mobile/compact spaces
export function LogoIcon({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div className={cn(sizes[size], className)}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24 4C24 4 8 20 8 30C8 38.8366 15.1634 46 24 46C32.8366 46 40 38.8366 40 30C40 20 24 4 24 4Z"
          fill="#0D5C2F"
        />
        <path
          d="M24 10C24 10 14 22 14 29C14 35.0751 18.9249 40 24 40C29.0751 40 34 35.0751 34 29C34 22 24 10 24 10Z"
          fill="rgba(255,255,255,0.3)"
        />
        <circle cx="20" cy="24" r="2" fill="white" />
        <circle cx="28" cy="24" r="2" fill="white" />
        <path d="M22 24H26" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="38" cy="10" r="5" fill="#FF8C00" />
      </svg>
    </div>
  );
}