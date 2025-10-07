#!/bin/bash

# NetPost V2 - Vercel Environment Variable Configuration Script
# This script helps configure all required environment variables in Vercel

set -e

echo "🚀 NetPost V2 - Vercel Environment Configuration"
echo "================================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo "   Install with: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Project root detected"
echo ""

# Function to set environment variable
set_env_var() {
    local name=$1
    local description=$2
    local required=$3
    local current_value=$4
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 $name"
    echo "   Description: $description"
    echo "   Required: $required"
    
    if [ -n "$current_value" ]; then
        echo "   Current value: ${current_value:0:10}... (hidden)"
        read -p "   Keep current value? (y/n): " keep
        if [ "$keep" = "y" ] || [ "$keep" = "Y" ]; then
            echo "   ✓ Keeping current value"
            return
        fi
    fi
    
    if [ "$required" = "true" ]; then
        read -p "   Enter value (required): " value
        while [ -z "$value" ]; do
            echo "   ❌ This variable is required"
            read -p "   Enter value: " value
        done
    else
        read -p "   Enter value (optional, press Enter to skip): " value
    fi
    
    if [ -n "$value" ]; then
        echo "   Setting environment variable..."
        vercel env add "$name" production <<< "$value" 2>/dev/null || true
        vercel env add "$name" preview <<< "$value" 2>/dev/null || true
        echo "   ✅ Set $name"
    else
        echo "   ⏭️  Skipped (optional)"
    fi
    echo ""
}

echo "📋 Configuring Required Environment Variables"
echo ""

# Database
echo "🗄️  DATABASE CONFIGURATION"
set_env_var "NEXT_PUBLIC_SUPABASE_URL" "https://hfvrnidlwnrwvhrhyzzr.supabase.co" "true" ""
set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdnJuaWRsd25yd3Zocmh5enpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NzMzMDksImV4cCI6MjA3MzU0OTMwOX0.4ul69xaoFAX0NjvgKxzUc4idOZ65guJ_hI2upEOkeJo" "true" ""
set_env_var "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdnJuaWRsd25yd3Zocmh5enpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhd7DJTewy7H8FarYaN7p2jOn70SUzMOCuLk6xe4N0p968CI6MTc1Nzk3MzMwOSwiZXhwIjoyMDczNTQ5MzA5fQ" "true" ""

# Authentication
echo "🔐 AUTHENTICATION CONFIGURATION"
echo "   Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "   Generated: ${NEXTAUTH_SECRET:0:10}..."
vercel env add "NEXTAUTH_SECRET" production <<< "$NEXTAUTH_SECRET" 2>/dev/null || true
vercel env add "NEXTAUTH_SECRET" preview <<< "$NEXTAUTH_SECRET" 2>/dev/null || true
echo "   ✅ Set NEXTAUTH_SECRET"
echo ""

set_env_var "NEXTAUTH_URL" "NextAuth base URL (e.g., https://your-app.vercel.app)" "true" ""

# Payment
echo "💳 PAYMENT CONFIGURATION (Stripe)"
set_env_var "STRIPE_SECRET_KEY" "Stripe secret key" "true" ""
set_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Stripe publishable key" "true" ""
set_env_var "STRIPE_WEBHOOK_SECRET" "Stripe webhook secret" "true" ""

# Node Environment
echo "⚙️  ENVIRONMENT CONFIGURATION"
echo "   Setting NODE_ENV=production..."
vercel env add "NODE_ENV" production <<< "production" 2>/dev/null || true
vercel env add "NODE_ENV" preview <<< "production" 2>/dev/null || true
echo "   ✅ Set NODE_ENV"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Environment variable configuration complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Verify variables in Vercel dashboard:"
echo "      https://vercel.com/rosager/v0-netpost-v2/settings/environment-variables"
echo ""
echo "   2. Redeploy the application:"
echo "      vercel --prod"
echo ""
echo "   3. Or trigger redeploy from GitHub:"
echo "      git commit --allow-empty -m 'trigger redeploy with env vars'"
echo "      git push origin main"
echo ""
echo "🎉 Done!"

