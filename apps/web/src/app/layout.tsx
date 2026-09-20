// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FuelLink - Nigeria's Digital Petroleum Exchange",
  description:
    "The digital nervous system for Nigeria's downstream petroleum sector. Real-time pricing, verified inventory, secure escrow payments.",
  keywords: [
    "fuel",
    "petroleum",
    "Nigeria",
    "depot",
    "diesel",
    "petrol",
    "AGO",
    "PMS",
    "oil and gas",
  ],
  authors: [{ name: "FuelLink" }],
  openGraph: {
    title: "FuelLink - Nigeria's Digital Petroleum Exchange",
    description:
      "Transform petroleum trading with real-time prices, verified stock, and secure payments.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1E293B",
              color: "#F8FAFC",
              borderRadius: "12px",
              padding: "16px",
            },
            success: {
              iconTheme: {
                primary: "#22C55E",
                secondary: "#F8FAFC",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#F8FAFC",
              },
            },
          }}
        />
      </body>
    </html>
  );
}