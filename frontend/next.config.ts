import path from "node:path";
import type { NextConfig } from "next";

const appRoot = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  output: "standalone",
  reactStrictMode: true,
  // Keep traces and Turbopack rooted on frontend/ even if a parent lockfile exists.
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
