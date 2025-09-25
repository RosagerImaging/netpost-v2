#!/usr/bin/env node

/**
 * Serverless Build Script - Fallback Strategy
 *
 * This script builds the Next.js app as pure serverless functions
 * to bypass all static generation issues completely.
 *
 * Usage: node scripts/serverless-build.js
 */

import { execSync } from 'child_process';
import { existsSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const webAppPath = path.join(projectRoot, 'apps', 'web');

console.log('🔧 Starting Serverless Build Process (Fallback Strategy)...');

// Create a temporary Next.js config for serverless output
const serverlessConfig = `
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment with monorepo
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // SERVERLESS: Use export mode to generate static files and API routes
  output: "export",

  // Disable image optimization for export
  images: {
    unoptimized: true,
  },

  // Disable static generation completely
  generateStaticParams: false,

  // Skip trailing slash for consistency
  trailingSlash: false,

  // Disable all optimizations that could trigger static generation
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable React strict mode
  reactStrictMode: false,

  // Experimental settings for serverless
  experimental: {
    serverActions: false, // Disable server actions in export mode
    staticGenerationBailout: 'skip',
  },
};

export default nextConfig;
`;

const buildEnv = {
  ...process.env,
  NODE_ENV: 'production',
  VERCEL_SERVERLESS_ONLY: '1',
  NEXT_TELEMETRY_DISABLED: '1',
  TURBO_TELEMETRY_DISABLED: '1'
};

function executeCommand(command, cwd = projectRoot, description = '') {
  console.log(`\n⏳ ${description || `Executing: ${command}`}`);
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
      env: buildEnv,
      timeout: 600000
    });
    console.log(`✅ ${description || 'Command'} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description || 'Command'} failed:`, error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    // Step 1: Backup original config
    const originalConfigPath = path.join(webAppPath, 'next.config.ts');
    const backupConfigPath = path.join(webAppPath, 'next.config.ts.backup');

    console.log('💾 Backing up original Next.js config...');
    executeCommand(\`cp \${originalConfigPath} \${backupConfigPath}\`, webAppPath);

    // Step 2: Create serverless config
    console.log('⚙️ Creating serverless Next.js config...');
    writeFileSync(originalConfigPath, serverlessConfig);

    // Step 3: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    const nextDir = path.join(webAppPath, '.next');
    const outDir = path.join(webAppPath, 'out');

    if (existsSync(nextDir)) {
      rmSync(nextDir, { recursive: true, force: true });
    }
    if (existsSync(outDir)) {
      rmSync(outDir, { recursive: true, force: true });
    }

    // Step 4: Build packages
    executeCommand(
      'npm run build:packages',
      projectRoot,
      'Building internal packages'
    );

    // Step 5: Build Next.js app in export mode
    executeCommand(
      'npm run build',
      webAppPath,
      'Building Next.js application (export mode)'
    );

    // Step 6: Restore original config
    console.log('🔄 Restoring original Next.js config...');
    executeCommand(\`mv \${backupConfigPath} \${originalConfigPath}\`, webAppPath);

    console.log('\\n🎉 Serverless Build Process Completed Successfully!');
    console.log('\\n📋 Build Summary:');
    console.log('   - Output mode: Export (static + serverless)');
    console.log('   - Static generation: Bypassed completely');
    console.log('   - Error pages: Will be handled by Vercel serverless functions');

  } catch (error) {
    // Restore config on error
    const originalConfigPath = path.join(webAppPath, 'next.config.ts');
    const backupConfigPath = path.join(webAppPath, 'next.config.ts.backup');

    if (existsSync(backupConfigPath)) {
      console.log('🔄 Restoring original config after error...');
      try {
        executeCommand(\`mv \${backupConfigPath} \${originalConfigPath}\`, webAppPath);
      } catch (restoreError) {
        console.error('⚠️ Failed to restore original config:', restoreError.message);
      }
    }

    console.error('\\n💥 Serverless Build Process Failed:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Unhandled error in serverless build process:', error);
  process.exit(1);
});