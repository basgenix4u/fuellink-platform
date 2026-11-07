import type { CSSProperties, ElementType, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
};

export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
}: RevealProps) {
  const step = Math.min(6, Math.max(0, Math.round(delay / 70)));
  const style = { "--reveal-step": step } as CSSProperties;

  return (
    <Tag style={style} className={`reveal ${className}`.trim()}>
      {children}
    </Tag>
  );
}
