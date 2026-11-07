import type { ReactNode } from "react";
import { Atmosphere } from "./Atmosphere";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  tone?: "light" | "ink";
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  tone = "light",
  className = "",
}: PageHeaderProps) {
  const ink = tone === "ink";

  return (
    <div
      className={`relative -mx-4 mb-6 overflow-hidden px-4 pb-6 pt-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${
        ink ? "rounded-b-3xl bg-[#04120b]" : ""
      } ${className}`}
    >
      <Atmosphere tone={tone} grid={false} orbs={false} />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <span
              className={`t-kicker inline-flex items-center gap-2 ${
                ink ? "text-emerald-300/90" : "text-primary-600"
              }`}
            >
              <span className="h-1 w-1 rounded-full bg-current" />
              {eyebrow}
            </span>
          ) : null}
          <h1
            className={`t-h2 mt-2 ${ink ? "text-white" : "text-slate-900"}`}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={`mt-1.5 max-w-2xl text-[13.5px] leading-relaxed ${
                ink ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
