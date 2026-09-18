// src/components/landing/Footer.tsx

"use client";

import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/shared/Button";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "For Depots", href: "/solutions/depot" },
      { label: "For Marketers", href: "/solutions/marketer" },
      { label: "For Drivers", href: "/solutions/driver" },
      { label: "Mobile App", href: "/mobile" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "API Documentation", href: "/docs/api" },
      { label: "Partners", href: "/partners" },
      { label: "Market Data", href: "/market-data" },
      { label: "Case Studies", href: "/case-studies" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Compliance", href: "/compliance" },
    ],
  },
};

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/fuellink", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com/fuellink", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com/fuellink", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/fuellink", label: "LinkedIn" },
  { icon: Youtube, href: "https://youtube.com/fuellink", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Stay Updated on Market Trends
              </h3>
              <p className="text-slate-400">
                Get weekly insights on petroleum prices and industry news.
              </p>
            </div>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
              <Button
                variant="secondary"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Logo & Info Column */}
          <div className="col-span-2">
            <Logo variant="white" size="lg" className="mb-6" />
            <p className="text-slate-400 mb-6 max-w-sm">
              Nigeria&apos;s leading digital platform for petroleum trading.
              Connecting depots, marketers, and transporters for seamless
              transactions.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:hello@fuellink.ng"
                className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
                hello@fuellink.ng
              </a>
              <a
                href="tel:+2348001234567"
                className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
              >
                <Phone className="w-5 h-5" />
                +234 xxxxxxxx
              </a>
              <div className="flex items-start gap-3 text-slate-400">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  Company Address....
                </span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors text-sm"
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

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} FuelLink Digital Exchange. All rights
              reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-secondary-500 hover:text-white transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}