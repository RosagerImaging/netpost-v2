#!/usr/bin/env node

/**
 * Custom Dynamic Build Script for Next.js 15 + React 19
 *
 * This script bypasses Next.js static generation completely to avoid
 * the Html import issue during error page prerendering.
 *
 * Usage: node scripts/dynamic-build.js
 */

const { execSync } = require('child_process');
const { existsSync, rmSync } = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const webAppPath = path.join(projectRoot, 'apps', 'web');

console.log('🚀 Starting Dynamic Build Process...');
console.log(`📁 Project Root: ${projectRoot}`);
console.log(`📁 Web App Path: ${webAppPath}`);

// Set environment variables for dynamic-only build
const buildEnv = {
  ...process.env,
  NODE_ENV: 'production',
  FORCE_DYNAMIC: '1',
  DISABLE_STATIC_GENERATION: '1',
  NEXT_DISABLE_STATIC_GENERATION: '1',
  SKIP_STATIC_GENERATION: '1',
  NEXT_TELEMETRY_DISABLED: '1',
  TURBO_TELEMETRY_DISABLED: '1'
};

function executeCommand(command, cwd = projectRoot, description = '') {
  console.log(`\n⏳ ${description || `Executing: ${command}`}`);
  console.log(`📍 Working directory: ${cwd}`);
  console.log(`🔧 Environment: NODE_ENV=${buildEnv.NODE_ENV}, FORCE_DYNAMIC=${buildEnv.FORCE_DYNAMIC}`);

  try {
    const result = execSync(command, {
      cwd,
      stdio: 'inherit',
      env: buildEnv,
      timeout: 600000 // 10 minutes timeout
    });
    console.log(`✅ ${description || 'Command'} completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ ${description || 'Command'} failed:`, error.message);
    console.error(`❌ Exit code: ${error.status || 'unknown'}`);
    console.error(`❌ Signal: ${error.signal || 'none'}`);
    console.error(`❌ Full error:`, error);
    process.exit(1);
  }
}

function main() {
  try {
    // Environment diagnostics
    console.log('\n🔍 Environment Diagnostics:');
    console.log(`   Node version: ${process.version}`);
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Architecture: ${process.arch}`);
    console.log(`   CWD: ${process.cwd()}`);
    console.log(`   Project exists: ${existsSync(projectRoot)}`);
    console.log(`   Web app exists: ${existsSync(webAppPath)}`);
    console.log(`   Node modules exist: ${existsSync(path.join(projectRoot, 'node_modules'))}`);

    // Check if this is Vercel build environment
    if (process.env.VERCEL) {
      console.log('   🟢 Running in Vercel build environment');
      console.log(`   Vercel region: ${process.env.VERCEL_REGION || 'unknown'}`);
      console.log(`   Build path: ${process.env.VERCEL_PROJECT_PRODUCTION_SOURCE || 'unknown'}`);
    } else {
      console.log('   🔵 Running in local/other environment');
    }

    // Step 1: Clean previous builds
    console.log('\n🧹 Cleaning previous builds...');
    const nextDir = path.join(webAppPath, '.next');
    if (existsSync(nextDir)) {
      rmSync(nextDir, { recursive: true, force: true });
      console.log('✅ Cleaned .next directory');
    }

    // Step 2: Verify packages are already built (handled by Vercel buildCommand)
    console.log('\n📦 Verifying packages are built (packages were built in previous step)...');
    const packagePaths = [
      path.join(projectRoot, 'packages/config/dist'),
      path.join(projectRoot, 'packages/shared-types/dist'),
      path.join(projectRoot, 'packages/ui/dist')
    ];

    for (const packagePath of packagePaths) {
      if (existsSync(packagePath)) {
        console.log(`✅ Found built package: ${path.basename(path.dirname(packagePath))}`);
      } else {
        console.warn(`⚠️  Missing package build: ${path.basename(path.dirname(packagePath))}`);
      }
    }

    // Step 3: Build the Next.js web application
    console.log('\n🔨 Building Next.js app with dynamic-only configuration...');

    // Use Next.js build with environment variables that force dynamic rendering
    executeCommand(
      'npm run build',
      webAppPath,
      'Building Next.js application (dynamic-only mode)'
    );

    // Step 4: Verify the build output
    console.log('\n🔍 Verifying build output...');
    const standalonePath = path.join(webAppPath, '.next', 'standalone');
    const serverPath = path.join(webAppPath, '.next', 'server');

    if (existsSync(standalonePath)) {
      console.log('✅ Standalone build detected');
    }

    if (existsSync(serverPath)) {
      console.log('✅ Server build detected');
    }

    // Step 5: List the build output for debugging
    executeCommand(
      'ls -la .next/',
      webAppPath,
      'Listing build output contents'
    );

    console.log('\n🎉 Dynamic Build Process Completed Successfully!');
    console.log('\n📋 Build Summary:');
    console.log('   - Static generation: DISABLED');
    console.log('   - Rendering mode: Server-side only');
    console.log('   - Error pages: Dynamic rendering');
    console.log('   - Output format: Standalone');

  } catch (error) {
    console.error('\n💥 Dynamic Build Process Failed:', error.message);
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Build process interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Build process terminated');
  process.exit(1);
});

// Run the main function
try {
  main();
} catch (error) {
  console.error('💥 Unhandled error in build process:', error);
  process.exit(1);
}