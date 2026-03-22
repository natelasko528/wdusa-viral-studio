import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Avoid picking a parent lockfile as the tracing root when multiple exist on disk
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
