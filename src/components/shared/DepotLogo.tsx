// src/components/shared/DepotLogo.tsx
// Unique depot logo component — fuel tank SVG silhouette with depot brand color
// Each depot gets their own color + initials making them visually distinct
"use client";

import { cn } from "@/lib/utils";

interface DepotLogoProps {
  name: string;
  initials: string;
  color: string; // hex color for brand
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTankIcon?: boolean; // show the fuel tank SVG background
}

const sizes = {
  sm: { container: "w-10 h-10", text: "text-sm", icon: 28 },
  md: { container: "w-14 h-14", text: "text-lg", icon: 40 },
  lg: { container: "w-20 h-20", text: "text-2xl", icon: 56 },
  xl: { container: "w-28 h-28", text: "text-3xl", icon: 80 },
};

// Fuel storage tank SVG icon
function TankSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 opacity-15"
    >
      {/* Large tank cylinder */}
      <ellipse cx="40" cy="20" rx="30" ry="10" fill={color} />
      <rect x="10" y="20" width="60" height="35" fill={color} />
      <ellipse cx="40" cy="55" rx="30" ry="10" fill={color} />
      {/* Pipe on top */}
      <rect x="36" y="8" width="8" height="14" rx="2" fill={color} />
      {/* Small tank */}
      <ellipse cx="68" cy="48" rx="10" ry="4" fill={color} />
      <rect x="58" y="48" width="20" height="14" fill={color} />
      <ellipse cx="68" cy="62" rx="10" ry="4" fill={color} />
      {/* Ground line */}
      <rect x="5" y="66" width="70" height="3" rx="1.5" fill={color} />
      {/* Support legs */}
      <rect x="16" y="55" width="5" height="11" rx="1" fill={color} />
      <rect x="59" y="55" width="5" height="11" rx="1" fill={color} />
    </svg>
  );
}

export function DepotLogo({
  name,
  initials,
  color,
  size = "md",
  className,
  showTankIcon = true,
}: DepotLogoProps) {
  const s = sizes[size];

  // Darken the color slightly for text contrast
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-2xl overflow-hidden flex-shrink-0",
        s.container,
        className
      )}
      style={{ backgroundColor: `${color}18`, border: `2px solid ${color}30` }}
    >
      {showTankIcon && <TankSVG size={s.icon} color={color} />}

      {/* Initials */}
      <span
        className={cn("relative z-10 font-black tracking-tight", s.text)}
        style={{ color }}
      >
        {initials}
      </span>
    </div>
  );
}

// Larger depot profile banner — used at top of depot detail page
export function DepotProfileBanner({
  name,
  initials,
  color,
  className,
}: {
  name: string;
  initials: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full h-40 sm:h-52 rounded-2xl overflow-hidden flex items-center justify-center",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${color}22 0%, ${color}44 50%, ${color}22 100%)`,
        border: `1px solid ${color}30`,
      }}
    >
      {/* Big tank silhouette background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        fill={color}
      >
        {/* Left large tank */}
        <ellipse cx="80" cy="40" rx="60" ry="22" />
        <rect x="20" y="40" width="120" height="90" />
        <ellipse cx="80" cy="130" rx="60" ry="22" />
        <rect x="68" y="15" width="24" height="30" rx="4" />
        {/* Middle tank */}
        <ellipse cx="220" cy="55" rx="50" ry="18" />
        <rect x="170" y="55" width="100" height="75" />
        <ellipse cx="220" cy="130" rx="50" ry="18" />
        <rect x="210" y="32" width="20" height="26" rx="4" />
        {/* Right small tank */}
        <ellipse cx="340" cy="70" rx="40" ry="14" />
        <rect x="300" y="70" width="80" height="60" />
        <ellipse cx="340" cy="130" rx="40" ry="14" />
        {/* Ground */}
        <rect x="0" y="152" width="400" height="6" rx="3" />
        {/* Pipes */}
        <rect x="130" y="90" width="50" height="8" rx="4" />
        <rect x="260" y="100" width="50" height="6" rx="3" />
      </svg>

      {/* Company name overlay */}
      <div className="relative z-10 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-2 shadow-lg"
          style={{ backgroundColor: color, color: "white" }}
        >
          {initials}
        </div>
        <p className="font-bold text-slate-800 text-sm px-4 text-center">{name}</p>
      </div>
    </div>
  );
}