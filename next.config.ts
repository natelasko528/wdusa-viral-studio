import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Avoid picking a parent lockfile as the tracing root when multiple exist on disk
  outputFileTracingRoot: path.join(__dirname),
  /** Playwright uses 127.0.0.1 while dev server prints localhost — allow both. */
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
