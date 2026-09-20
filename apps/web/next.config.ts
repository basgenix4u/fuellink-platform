import type { NextConfig } from "next";

// Static export: the public site (landing + /intel + /reports) is fully static,
// so one build deploys to any static host — GitHub Pages today (sub-path,
// NEXT_PUBLIC_BASE_PATH), Vercel at fuellink.ng later (no base path).
// `trailingSlash: true` emits an index.html per route directory, which static
// hosts (and GitHub Pages in particular) need for clean sub-path serving.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  transpilePackages: ["@fuellink/contracts"],
  output: "export",
  trailingSlash: true,
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
