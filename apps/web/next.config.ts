import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable static exports for error pages that are causing issues
    missingSuspenseWithCSRBailout: false,
  },
  // Skip static generation for problematic routes
  generateStaticParams: false,
};

export default nextConfig;
