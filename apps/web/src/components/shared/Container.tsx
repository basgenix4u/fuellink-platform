// src/components/shared/Container.tsx

import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "xs" | "sm" | "tight" | "default" | "wide" | "full";
  as?: "div" | "section" | "article" | "main";
  padding?: "none" | "sm" | "default" | "lg";
}

export function Container({
  children,
  className,
  size = "default",
  as: Component = "div",
  padding = "default",
}: ContainerProps) {
  const sizes = {
    xs: "max-w-2xl",
    sm: "max-w-3xl",
    tight: "max-w-4xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
    full: "max-w-[1600px]",
  };

  const paddings = {
    none: "",
    sm: "px-4",
    default: "px-4 sm:px-6 lg:px-8",
    lg: "px-4 sm:px-8 lg:px-12",
  };

  return (
    <Component
      className={cn(
        "mx-auto w-full",
        sizes[size],
        paddings[padding],
        className
      )}
    >
      {children}
    </Component>
  );
}

// Section wrapper with consistent spacing
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  size?: ContainerProps["size"];
  padding?: "sm" | "md" | "lg" | "xl";
  background?: "white" | "slate" | "primary" | "gradient" | "none";
  id?: string;
}

export function Section({
  children,
  className,
  size = "default",
  padding = "lg",
  background = "none",
  id,
}: SectionProps) {
  const paddings = {
    sm: "py-8 md:py-12",
    md: "py-12 md:py-16",
    lg: "py-16 md:py-24",
    xl: "py-24 md:py-32",
  };

  const backgrounds = {
    none: "",
    white: "bg-white",
    slate: "bg-slate-50",
    primary: "bg-primary-500",
    gradient: "bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900",
  };

  return (
    <section
      id={id}
      className={cn(paddings[padding], backgrounds[background], className)}
    >
      <Container size={size}>{children}</Container>
    </section>
  );
}