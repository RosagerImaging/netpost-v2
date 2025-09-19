import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ["@radix-ui/react-select", "@radix-ui/react-dialog", "@radix-ui/react-checkbox", "@radix-ui/react-label"],
  },
  transpilePackages: ["@netpost/ui", "@netpost/shared-types"],
  images: {
    domains: [], // Add your image domains here
  },
};

export default nextConfig;
