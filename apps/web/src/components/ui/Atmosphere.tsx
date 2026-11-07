type AtmosphereProps = {
  tone?: "light" | "ink" | "brand";
  grid?: boolean;
  beams?: boolean;
  orbs?: boolean;
  className?: string;
};

export function Atmosphere({
  tone = "light",
  grid = true,
  beams = false,
  orbs = true,
  className = "",
}: AtmosphereProps) {
  const isInk = tone === "ink" || tone === "brand";

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className={`absolute inset-0 ${isInk ? "mesh-ink" : "mesh-brand"}`} />

      {grid ? (
        <div
          className={`absolute inset-x-0 top-0 h-[520px] ${
            isInk ? "grid-lines-dark" : "grid-lines"
          }`}
        />
      ) : null}

      {orbs ? (
        <>
          <div
            className="absolute -left-40 -top-48 h-[460px] w-[460px] rounded-full opacity-[0.18] blur-[100px]"
            style={{
              background: "radial-gradient(circle, #17a34a 0%, transparent 68%)",
              animation: "fl-drift 18s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -right-32 top-10 h-[400px] w-[400px] rounded-full opacity-[0.14] blur-[100px]"
            style={{
              background: "radial-gradient(circle, #ff8c00 0%, transparent 68%)",
              animation: "fl-drift 22s ease-in-out infinite reverse",
            }}
          />
        </>
      ) : null}

      {beams ? (
        <svg
          className="absolute inset-x-0 top-0 h-[560px] w-full opacity-[0.5]"
          viewBox="0 0 1440 560"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="beam-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={isInk ? "#34d399" : "#17a34a"} stopOpacity="0.5" />
              <stop offset="100%" stopColor={isInk ? "#34d399" : "#17a34a"} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="beam-b" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff8c00" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#ff8c00" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-60 300 C 260 180, 420 420, 760 300 S 1180 140, 1560 260"
            stroke="url(#beam-a)"
            strokeWidth="1.25"
            strokeDasharray="6 10"
            style={{ animation: "fl-flow 26s linear infinite" }}
          />
          <path
            d="M-60 420 C 300 340, 520 520, 880 400 S 1240 300, 1560 380"
            stroke="url(#beam-b)"
            strokeWidth="1.25"
            strokeDasharray="4 12"
            style={{ animation: "fl-flow 34s linear infinite reverse" }}
          />
        </svg>
      ) : null}

      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E\")",
          opacity: isInk ? 0.16 : 0.35,
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  );
}
