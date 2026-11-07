import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Landmark,
  Radio,
  Gauge,
  Clock3,
} from "lucide-react";
import { latestGantryPrice, latestMonth } from "@/lib/intel";

function naira(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function HeroSection() {
  const month = latestMonth();
  const lagos = latestGantryPrice("nmdpra_indicative_lagos");
  const abuja = latestGantryPrice("nmdpra_indicative_abuja");
  const cover = month.sufficiencyDays;

  const coverRows = [
    { label: "PMS", value: cover.pms },
    { label: "AGO", value: cover.agod },
    { label: "ATK", value: cover.atk },
    { label: "LPG", value: cover.lpg },
  ].filter((row) => row.value != null) as { label: string; value: number }[];

  const peak = coverRows.reduce((max, row) => Math.max(max, row.value), 1);

  return (
    <section className="relative overflow-hidden bg-white pt-[92px] lg:pt-[116px]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px] grid-lines" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full opacity-[0.16] blur-[90px]"
        style={{ background: "radial-gradient(circle, #17a34a 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 h-[380px] w-[380px] rounded-full opacity-[0.14] blur-[90px]"
        style={{ background: "radial-gradient(circle, #ff8c00 0%, transparent 70%)" }}
      />

      <div className="page-max page-x relative pb-10 lg:pb-16">
        <div className="bento items-start">
          <div className="col-12 col-lg-7">
            <div
              className="blur-up inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-white/80 px-2.5 py-1 shadow-[var(--shadow-xs)] backdrop-blur"
              style={{ animationDelay: "0ms" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-600" />
              </span>
              <span className="t-kicker text-slate-600">
                NMDPRA fact sheet · {month.label}
              </span>
            </div>

            <h1
              className="t-display blur-up mt-5 text-slate-900"
              style={{ animationDelay: "70ms" }}
            >
              Nigeria&rsquo;s fuel market,
              <br />
              <span className="text-gradient-brand">priced in the open.</span>
            </h1>

            <p className="t-lede blur-up mt-5 max-w-xl" style={{ animationDelay: "140ms" }}>
              Verified depots, gantry prices straight from the regulator&rsquo;s own fact
              sheets, and bank-held escrow so neither side of a{" "}
              <span className="t-editorial font-medium text-slate-900">33,000&nbsp;litre</span>{" "}
              trade carries counterparty risk.
            </p>

            <div
              className="blur-up mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center"
              style={{ animationDelay: "210ms" }}
            >
              <Link
                href="/intel"
                className="press group flex h-12 items-center justify-center gap-2 rounded-xl bg-[#04120b] px-5 text-[14px] font-medium text-white shadow-[var(--shadow-md)] hover:bg-[#0b2f1c]"
              >
                Open the intelligence terminal
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/register/depot"
                className="press flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--hairline-strong)] bg-white px-5 text-[14px] font-medium text-slate-800 hover:border-slate-300"
              >
                List your depot
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div
              className="blur-up mt-7 flex flex-wrap items-center gap-x-5 gap-y-2"
              style={{ animationDelay: "280ms" }}
            >
              <span className="flex items-center gap-1.5 t-meta">
                <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
                Escrow released on delivery
              </span>
              <span className="flex items-center gap-1.5 t-meta">
                <Landmark className="h-3.5 w-3.5 text-primary-600" />
                Bank-held, not platform-held
              </span>
              <span className="flex items-center gap-1.5 t-meta">
                <Radio className="h-3.5 w-3.5 text-primary-600" />
                Regulator-sourced data
              </span>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div
              className="blur-up surface shadow-[var(--shadow-lg)]"
              style={{ animationDelay: "120ms" }}
            >
              <div className="flex items-center justify-between border-b border-[var(--hairline)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary-600" />
                  <span className="text-[13px] font-medium text-slate-900">
                    PMS ex-gantry indicative
                  </span>
                </div>
                <span className="tnum rounded-md bg-slate-900/[0.05] px-1.5 py-0.5 text-[10.5px] text-slate-600">
                  {lagos.date || month.month}
                </span>
              </div>

              <div className="grid grid-cols-2 divide-x divide-[var(--hairline)]">
                <div className="px-4 py-4">
                  <p className="t-kicker text-slate-400">Lagos</p>
                  <p className="tnum mt-1.5 text-[26px] font-medium leading-none text-slate-900">
                    <span className="mr-0.5 inline-block -translate-y-[0.18em] text-[13px] font-normal text-slate-400">₦</span>
                    {naira(lagos.value)}
                  </p>
                  <p className="t-meta mt-1">per litre</p>
                </div>
                <div className="px-4 py-4">
                  <p className="t-kicker text-slate-400">Abuja</p>
                  <p className="tnum mt-1.5 text-[26px] font-medium leading-none text-slate-900">
                    <span className="mr-0.5 inline-block -translate-y-[0.18em] text-[13px] font-normal text-slate-400">₦</span>
                    {naira(abuja.value)}
                  </p>
                  <p className="t-meta mt-1">per litre</p>
                </div>
              </div>

              <div className="border-t border-[var(--hairline)] px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="t-kicker text-slate-400">Days of cover</span>
                  <span className="flex items-center gap-1 t-meta">
                    <Clock3 className="h-3 w-3" />
                    {month.label}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {coverRows.map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="tnum w-8 shrink-0 text-[11px] text-slate-500">
                        {row.label}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/[0.07]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                          style={{ width: `${Math.round((row.value / peak) * 100)}%` }}
                        />
                      </div>
                      <span className="tnum w-12 shrink-0 text-right text-[12px] font-medium text-slate-900">
                        {row.value.toFixed(1)}d
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-b-[16px] bg-[#f7f8f7] px-4 py-2.5">
                <span className="t-meta">Source: NMDPRA</span>
                <Link
                  href="/intel/gantry"
                  className="press inline-flex items-center gap-1 text-[11.5px] font-medium text-primary-700"
                >
                  Full ladder
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden border-y border-[var(--hairline)] bg-[#f7f8f7]">
        <div className="marquee marquee-pause py-2.5">
          {[0, 1].map((pass) => (
            <div key={pass} className="flex shrink-0 items-center" aria-hidden={pass === 1}>
              {[
                ["PMS · Lagos", naira(lagos.value)],
                ["PMS · Abuja", naira(abuja.value)],
                ["PMS supply", `${month.supply.pmsTotalMld ?? "—"} ML/d`],
                ["PMS consumption", `${month.consumption.pmsMld ?? "—"} ML/d`],
                ["DPRP utilisation", `${month.dprp.utilizationPct ?? "—"}%`],
                ["State of the sector", month.label],
                ["AGO cover", `${cover.agod ?? "—"} days`],
                ["ATK cover", `${cover.atk ?? "—"} days`],
              ].map(([label, value]) => (
                <span key={`${pass}-${label}`} className="flex items-center gap-2 px-5">
                  <span className="t-kicker text-slate-400">{label}</span>
                  <span className="tnum text-[12.5px] font-medium text-slate-800">{value}</span>
                  <span className="ml-2 h-1 w-1 rounded-full bg-slate-300" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
