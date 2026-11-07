import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { monthLabel, latestMonth } from "@/lib/intel";

const columns = [
  {
    title: "Intelligence",
    links: [
      { label: "Terminal", href: "/intel" },
      { label: "Gantry prices", href: "/intel/gantry" },
      { label: "Lomé index", href: "/intel/lome" },
      { label: "Days of cover", href: "/intel/sufficiency" },
      { label: "Landed cost", href: "/intel/calculator" },
      { label: "Monthly reports", href: "/reports" },
    ],
  },
  {
    title: "Depots",
    links: [
      { label: "Console", href: "/depot" },
      { label: "Inventory", href: "/depot/inventory" },
      { label: "Orders", href: "/depot/orders" },
      { label: "Verification", href: "/depot/verification" },
      { label: "List a depot", href: "/register/depot" },
    ],
  },
  {
    title: "Marketers",
    links: [
      { label: "Workspace", href: "/marketer" },
      { label: "Find depots", href: "/marketer/depots" },
      { label: "Cost & spread", href: "/marketer/predictor" },
      { label: "My orders", href: "/marketer/orders" },
      { label: "Create account", href: "/register/marketer" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Register as depot", href: "/register/depot" },
      { label: "Register as marketer", href: "/register/marketer" },
      { label: "Subscriptions", href: "/marketer/subscribe" },
      { label: "Price alerts", href: "/marketer/alerts" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/fuellink", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com/fuellink", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com/fuellink", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/fuellink", label: "LinkedIn" },
  { icon: Youtube, href: "https://youtube.com/fuellink", label: "YouTube" },
];

export function Footer() {
  const month = latestMonth();

  return (
    <footer className="relative overflow-hidden bg-[#04120b] text-[#f4f7f5]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[320px] grid-lines-dark" />

      <div className="page-max page-x relative">
        <div className="grid gap-6 border-b border-white/10 py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
          <div className="min-w-0 lg:col-span-5">
            <Logo variant="white" size="md" />
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-slate-400">
              Nigeria&apos;s digital petroleum exchange. Verified depots, regulator-sourced
              pricing and bank-held escrow from gantry to pump.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href="mailto:hello@fuellink.ng"
                className="press inline-flex min-h-11 items-center gap-2 text-[13px] text-slate-300 hover:text-white"
              >
                <Mail className="h-4 w-4" />
                hello@fuellink.ng
              </a>
            </div>

            <div className="mt-5 flex items-center gap-1.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4">
              {columns.map((column) => (
                <div key={column.title} className="min-w-0">
                  <p className="t-kicker mb-3 text-slate-500">{column.title}</p>
                  <ul className="space-y-0.5">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="press flex min-h-9 items-center text-[13px] text-slate-400 hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-white/10 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white">
              The monthly fact sheet, parsed and published
            </p>
            <p className="t-meta mt-0.5 text-slate-500">
              Every figure traced to an NMDPRA source document. Latest edition {month.label}.
            </p>
          </div>
          <Link
            href="/reports"
            className="press inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-[13px] font-medium text-white hover:bg-white/[0.1] sm:w-auto"
          >
            Read the {monthLabel(month.month)}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-meta text-slate-500">
            © {new Date().getFullYear()} FuelLink Digital Exchange. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 t-meta text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Data current to {month.label}
            </span>
            <Link
              href="/intel/gantry"
              className="press inline-flex items-center gap-0.5 text-[12px] text-slate-400 hover:text-white"
            >
              Source ledger
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
