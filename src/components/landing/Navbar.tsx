"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Building2,
  ShoppingCart,
  BarChart3,
  Shield,
  Newspaper,
  Bot,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label: string;
  href: string;
  description: string;
  icon: React.ElementType;
}

interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
  dropdownItems?: DropdownItem[];
}

const navLinks: NavLink[] = [
  {
    label: "For Depots",
    href: "/register/depot",
    hasDropdown: true,
    dropdownItems: [
      {
        label: "List Your Depot",
        href: "/register/depot",
        description: "Join Nigeria's largest petroleum exchange",
        icon: Building2,
      },
      {
        label: "AI-Powered Chat",
        href: "#ai-chat",
        description: "Let AI handle marketer inquiries 24/7",
        icon: Bot,
      },
      {
        label: "Advertise Products",
        href: "#advertise",
        description: "Reach thousands of active marketers",
        icon: Megaphone,
      },
    ],
  },
  {
    label: "For Marketers",
    href: "/register/marketer",
    hasDropdown: true,
    dropdownItems: [
      {
        label: "Find Depots",
        href: "/register/marketer",
        description: "Access verified depots across Nigeria",
        icon: ShoppingCart,
      },
      {
        label: "AI Price Predictor",
        href: "#price-predictor",
        description: "Real-time oil price intelligence",
        icon: TrendingUp,
      },
      {
        label: "Refinery Prices",
        href: "#refineries",
        description: "Live prices from all Nigerian refineries",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Media Hub",
    href: "/media",
  },
  {
    label: "Security",
    href: "#security",
  },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg shadow-slate-900/5"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* ✅ FIXED LOGO (no nested Link anymore) */}
            <Logo
              variant={isScrolled ? "default" : "white"}
              size="md"
              className="flex-shrink-0"
            />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() =>
                    link.hasDropdown && setActiveDropdown(link.label)
                  }
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isScrolled
                        ? "text-slate-700 hover:text-primary-600 hover:bg-primary-50"
                        : "text-white/90 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {link.label}
                    {link.hasDropdown && (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          activeDropdown === link.label && "rotate-180"
                        )}
                      />
                    )}
                  </Link>

                  <AnimatePresence>
                    {link.hasDropdown && activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                      >
                        <div className="p-2">
                          {link.dropdownItems?.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                            >
                              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100">
                                <item.icon className="w-4 h-4 text-primary-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.label}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login">
                <Button variant={isScrolled ? "outline" : "ghost"} size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register/marketer">
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-40 bg-white lg:hidden"
          >
            <div className="pt-20 px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block py-3 font-semibold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}