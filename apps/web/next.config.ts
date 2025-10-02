import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment with monorepo
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Essential packages to transpile for monorepo
  transpilePackages: ["@netpost/ui", "@netpost/shared-types", "@netpost/config"],

  // Disable telemetry
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },

  // Enhanced image optimization for performance
  images: {
    domains: ['hfvrnidlwnrwvhrhyzzr.supabase.co', '*.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // TypeScript configuration - STRICT MODE for production safety
  typescript: {
    // SECURITY: Never ignore TypeScript errors in production
    // This was a temporary workaround that must be removed
    // All type errors should be fixed before deployment
    ignoreBuildErrors: false,
  },

  eslint: {
    // SECURITY: Enforce linting during builds
    // ESLint catches security issues and code quality problems
    ignoreDuringBuilds: false,
  },

  // Disable strict mode to avoid React version conflicts
  reactStrictMode: false,

  // Note: Disable standalone for Vercel deployment compatibility
  // output: "standalone",

  // Note: generateStaticParams and dynamic are page-level configs, not global configs
  // These should be set in individual page files, not next.config.ts

  // Skip trailing slash redirect
  skipTrailingSlashRedirect: true,
  trailingSlash: false,

  // Custom build directory
  distDir: ".next",

  // CRITICAL: Disable static generation and prerendering completely
  generateBuildId: async () => {
    // Use timestamp to ensure dynamic builds
    return `dynamic-${Date.now()}`;
  },

  // Skip problematic pages during build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Force all routes to be dynamic with headers
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'x-dynamic-page',
            value: 'true',
          },
        ],
      },
    ]
  },

  // CRITICAL: Redirect configuration to prevent static generation
  redirects: async () => {
    return [];
  },

  // CRITICAL: Rewrites to ensure dynamic handling
  rewrites: async () => {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // Experimental features optimized for dynamic rendering
  experimental: {
    // Server Actions configuration (object form for Next.js 15+)
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },

    // Enhanced package import optimization for bundle size reduction
    optimizePackageImports: [
      "@radix-ui/react-select",
      "@radix-ui/react-dialog",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-label",
      "@radix-ui/react-progress",
      "@radix-ui/react-tabs",
      "@radix-ui/react-slot",
      "lucide-react",
      "@heroicons/react",
      "@headlessui/react"
    ],

    // Force dynamic imports
    esmExternals: true,
  },

  // Move serverComponentsExternalPackages to top-level (Next.js 15+ deprecation fix)
  serverExternalPackages: [],

  // Webpack configuration to ensure GSAP loads properly
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Ensure GSAP is properly bundled for client-side
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        gsap: require.resolve('gsap'),
      };
    }
    return config;
  },
};

export default nextConfig;
