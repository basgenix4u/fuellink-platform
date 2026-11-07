import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  adjustFontFallback: true,
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
  preload: false,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fuellink.ng";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FuelLink — Nigeria's Digital Petroleum Exchange",
    template: "%s · FuelLink",
  },
  description:
    "Verified depots, transparent gantry pricing and bank-held escrow for Nigeria's downstream petroleum market. Real data from NMDPRA fact sheets.",
  applicationName: "FuelLink",
  keywords: [
    "fuel",
    "petroleum",
    "Nigeria",
    "depot",
    "diesel",
    "petrol",
    "AGO",
    "PMS",
    "ATK",
    "LPG",
    "escrow",
    "gantry price",
  ],
  authors: [{ name: "FuelLink" }],
  creator: "FuelLink",
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: "/" },
  openGraph: {
    title: "FuelLink — Nigeria's Digital Petroleum Exchange",
    description:
      "Verified depots, transparent gantry pricing and bank-held escrow for Nigeria's downstream petroleum market.",
    type: "website",
    locale: "en_NG",
    siteName: "FuelLink",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "FuelLink — Nigeria's Digital Petroleum Exchange",
    description:
      "Verified depots, transparent gantry pricing and bank-held escrow for Nigeria's downstream petroleum market.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#04120b" },
  ],
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-NG"
      className={`${sans.variable} ${mono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-white font-sans text-slate-900 antialiased [text-rendering:optimizeLegibility]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0b1a12",
              color: "#f4f7f5",
              borderRadius: "14px",
              padding: "14px 16px",
              fontSize: "14px",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 20px 40px -12px rgba(0,0,0,0.35)",
            },
            success: { iconTheme: { primary: "#16a34a", secondary: "#f4f7f5" } },
            error: { iconTheme: { primary: "#dc2626", secondary: "#f4f7f5" } },
          }}
        />
      </body>
    </html>
  );
}
