#!/bin/bash
set -e

echo "🧪 Testing Vercel Build Configuration"
echo "====================================="

# Test the exact build command that Vercel will use
echo "📦 Testing build command: turbo build --filter=web"
echo ""

# Run the build command with verbose output
export TURBO_LOG_LEVEL=debug
export NODE_ENV=production
export VERCEL=1
export VERCEL_ENV=production

# Execute the build
turbo build --filter=web --verbose

echo ""
echo "✅ Build test completed successfully!"
echo ""
echo "📋 Summary:"
echo "- ✅ Dependencies built: @netpost/config, @netpost/shared-types, @netpost/ui"
echo "- ✅ Web app built successfully"
echo "- ✅ Output directory: apps/web/.next"
echo ""
echo "🚀 Ready for Vercel deployment!"