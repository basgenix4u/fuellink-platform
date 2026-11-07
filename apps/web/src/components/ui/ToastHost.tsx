"use client";

import { Toaster } from "react-hot-toast";

export function ToastHost() {
  return (
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
  );
}
