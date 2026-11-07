import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "muted" | "ink";
  backdrop?: boolean;
  className?: string;
  headerClassName?: string;
};

const tones = {
  light: "bg-white text-slate-900",
  muted: "bg-[#f7f8f7] text-slate-900",
  ink: "bg-[#04120b] text-[#f4f7f5]",
};

export function Section({
  children,
  id,
  eyebrow,
  title,
  lede,
  align = "left",
  tone = "light",
  backdrop = false,
  className = "",
  headerClassName = "",
}: SectionProps) {
  const alignment =
    align === "center" ? "items-center text-center mx-auto max-w-2xl" : "items-start";

  return (
    <section
      id={id}
      className={`relative overflow-hidden ${tones[tone]} ${className}`}
    >
      {backdrop ? (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-[420px] ${
            tone === "ink" ? "grid-lines-dark" : "grid-lines"
          }`}
        />
      ) : null}

      <div className="page-max page-x relative py-14 sm:py-18 lg:py-24">
        {title || eyebrow || lede ? (
          <header className={`mb-8 flex flex-col gap-3 sm:mb-12 ${alignment} ${headerClassName}`}>
            {eyebrow ? (
              <span
                className={`t-kicker inline-flex items-center gap-2 ${
                  tone === "ink" ? "text-[#8fd6ab]" : "text-primary-600"
                }`}
              >
                <span className="h-1 w-1 rounded-full bg-current" />
                {eyebrow}
              </span>
            ) : null}
            {title ? (
              <h2 className={`t-h1 ${tone === "ink" ? "text-white" : "text-slate-900"}`}>
                {title}
              </h2>
            ) : null}
            {lede ? (
              <p
                className={`t-lede ${
                  tone === "ink" ? "max-w-2xl text-slate-300" : "max-w-2xl"
                }`}
              >
                {lede}
              </p>
            ) : null}
          </header>
        ) : null}

        {children}
      </div>
    </section>
  );
}
