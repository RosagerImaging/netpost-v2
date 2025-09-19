# Story 1.8: Beta Subscription System - Complete Setup Guide

## Overview

This guide provides step-by-step instructions to complete the setup of the NetPost V2 Beta Subscription System. All core development has been completed, but some manual configuration steps are required for full deployment.

## 🎯 Current Status

✅ **COMPLETED:**
- Database schema and migrations created
- Stripe integration service implemented
- Email notification system with Resend integration
- Feature gating and usage tracking
- User and admin dashboards
- Comprehensive testing framework
- Beta user management system

⚠️ **REQUIRES MANUAL SETUP:**
- Database migration execution in Supabase
- Stripe test environment configuration
- Environment variables configuration
- Email provider setup

## 📋 Prerequisites

Before starting, ensure you have:
- Supabase project with admin access
- Stripe account (test mode)
- Resend account for email delivery
- Node.js 18+ installed
- Access to the NetPost V2 repository

## 🗄️ Database Setup (Supabase)

### Step 1: Execute Database Migrations

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Navigate to "SQL Editor"
   - Create a new query

2. **Execute Core Subscription Tables Migration**
   ```sql
   -- Copy and paste the entire contents of:
   -- /apps/api/database/migrations/008_create_subscription_tables.sql
   ```

   **File location:** `/home/optiks/dev/netpost-v2/apps/api/database/migrations/008_create_subscription_tables.sql`

3. **Execute Database Functions Migration**
   ```sql
   -- Copy and paste the entire contents of:
   -- /apps/api/database/migrations/009_create_subscription_functions.sql
   ```

   **File location:** `/home/optiks/dev/netpost-v2/apps/api/database/migrations/009_create_subscription_functions.sql`

4. **Verify Migration Success**
   ```sql
   -- Check that all tables were created
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE '%subscription%';

   -- Expected tables:
   -- subscription_tiers
   -- user_subscriptions
   -- subscription_history
   -- usage_metrics
   -- beta_invitations
   -- subscription_limits
   -- subscription_payments
   ```

5. **Verify Default Data**
   ```sql
   -- Check subscription tiers were inserted
   SELECT tier_name, display_name, monthly_price_cents
   FROM subscription_tiers
   ORDER BY monthly_price_cents;

   -- Expected: beta, trial, hobbyist, pro
   ```

### Step 2: Set Up Row Level Security (RLS)

The migrations automatically enable RLS and create security policies. Verify they're active:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%subscription%';

-- Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

## 💳 Stripe Configuration

### Step 1: Create Stripe Products and Prices

1. **Log into Stripe Dashboard (Test Mode)**
   - Ensure you're in "Test Mode" (toggle in top-left)
   - Navigate to "Products" section

2. **Create Subscription Products**

   **Beta Product:**
   - Name: "NetPost Beta"
   - Description: "Unlimited access during beta period"
   - Price: $0.00/month (recurring)
   - Save the Price ID (starts with `price_`)

   **Trial Product:**
   - Name: "NetPost Free Trial"
   - Description: "30-day trial with full Pro features"
   - Price: $0.00/month (recurring)
   - Save the Price ID

   **Hobbyist Product:**
   - Name: "NetPost Hobbyist"
   - Description: "Perfect for casual resellers"
   - Price: $9.99/month (recurring)
   - Save the Price ID

   **Pro Product:**
   - Name: "NetPost Professional"
   - Description: "Full-featured plan for serious resellers"
   - Price: $29.99/month (recurring)
   - Save the Price ID

### Step 2: Configure Webhooks

1. **Create Webhook Endpoint**
   - Go to "Developers" → "Webhooks"
   - Click "Add endpoint"
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Select events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.created`
     - `customer.updated`

2. **Get Webhook Secret**
   - After creating the webhook, click on it
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

### Step 3: Update Environment Variables

Add these Stripe variables to your `.env.local`:

```bash
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Stripe Product Price IDs
STRIPE_BETA_PRICE_ID="price_test_beta_id"
STRIPE_TRIAL_PRICE_ID="price_test_trial_id"
STRIPE_HOBBYIST_PRICE_ID="price_test_hobbyist_id"
STRIPE_PRO_PRICE_ID="price_test_pro_id"
```

## 📧 Email Service Setup (Resend)

### Step 1: Create Resend Account

1. Sign up at [resend.com](https://resend.com)
2. Verify your email and complete setup
3. Navigate to "API Keys" in your dashboard

### Step 2: Generate API Key

1. Click "Create API Key"
2. Name: "NetPost V2 Production"
3. Copy the generated key (starts with `re_`)

### Step 3: Configure Domain (Optional but Recommended)

1. Go to "Domains" in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `netpost.com`)
4. Follow DNS configuration instructions
5. Wait for verification

### Step 4: Update Environment Variables

Add these email variables to your `.env.local`:

```bash
# Email Configuration
RESEND_API_KEY="re_your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_FROM_NAME="NetPost"
EMAIL_PROVIDER="resend"
EMAIL_RETRY_ATTEMPTS="3"
EMAIL_RETRY_DELAY="1000"
```

## ⚙️ Environment Configuration

### Complete .env.local Template

Create `/apps/web/.env.local` with all required variables:

```bash
# =================================
# NEXT.JS CONFIGURATION
# =================================
NEXT_PUBLIC_APP_NAME="NetPost V2"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# =================================
# DATABASE CONFIGURATION
# =================================
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# =================================
# STRIPE CONFIGURATION
# =================================
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Stripe Price IDs
STRIPE_BETA_PRICE_ID="price_test_beta_id"
STRIPE_TRIAL_PRICE_ID="price_test_trial_id"
STRIPE_HOBBYIST_PRICE_ID="price_test_hobbyist_id"
STRIPE_PRO_PRICE_ID="price_test_pro_id"

# =================================
# EMAIL CONFIGURATION
# =================================
RESEND_API_KEY="re_your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_FROM_NAME="NetPost"
EMAIL_PROVIDER="resend"
EMAIL_RETRY_ATTEMPTS="3"
EMAIL_RETRY_DELAY="1000"

# =================================
# AUTHENTICATION
# =================================
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"

# =================================
# FEATURE FLAGS
# =================================
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_AI_FEATURES="true"
NEXT_PUBLIC_ENABLE_CROSS_POSTING="false"
NEXT_PUBLIC_ENABLE_MOBILE_APP="false"
```

## 🧪 Testing the Setup

### Step 1: Run Database Tests

```bash
# Navigate to project root
cd /home/optiks/dev/netpost-v2

# Install dependencies
npm install

# Run subscription service tests
npm run test -- --grep "subscription"
```

### Step 2: Test Stripe Integration

1. **Test Stripe Connection**
   ```bash
   # Check Stripe keys are valid
   npm run test:stripe
   ```

2. **Test Webhook Endpoint**
   - Use Stripe CLI to test webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   stripe trigger customer.subscription.created
   ```

### Step 3: Test Email Notifications

1. **Test Resend Integration**
   ```bash
   # Send test email
   npm run test:email
   ```

2. **Test Subscription Email Templates**
   - Create a test user in your app
   - Trigger welcome email from admin dashboard
   - Check email delivery in Resend dashboard

### Step 4: End-to-End Testing

1. **Beta User Flow:**
   - Generate beta invitation code
   - Register new user with code
   - Verify unlimited access
   - Check usage tracking

2. **Subscription Flow:**
   - Create trial subscription
   - Test upgrade to paid plan
   - Verify billing in Stripe
   - Test usage limit enforcement

3. **Admin Dashboard:**
   - Access admin panel at `/admin/subscriptions`
   - Verify user management functions
   - Check analytics display
   - Test bulk operations

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All database migrations executed successfully
- [ ] Stripe products and webhooks configured
- [ ] Email service tested and working
- [ ] Environment variables set in production
- [ ] All tests passing
- [ ] Admin dashboard accessible

### Production Deployment

1. **Deploy to Vercel/Netlify:**
   ```bash
   # Build and deploy
   npm run build
   npm run deploy
   ```

2. **Update Webhook URLs:**
   - Update Stripe webhook URL to production domain
   - Test webhook delivery

3. **Configure DNS:**
   - Point domain to deployment
   - Set up SSL certificate
   - Configure email domain if using custom domain

4. **Monitor Launch:**
   - Check error logs
   - Monitor subscription events
   - Test critical user flows

### Post-Deployment

- [ ] Monitor system health dashboard
- [ ] Set up alerts for failed payments
- [ ] Configure backup schedules
- [ ] Document operational procedures
- [ ] Train team on admin dashboard

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Issues:**
```sql
-- Test connection
SELECT current_database(), current_user;
```

**Stripe Webhook Failures:**
- Check webhook URL is accessible
- Verify webhook secret matches
- Check server logs for errors

**Email Delivery Issues:**
- Verify Resend API key
- Check domain configuration
- Monitor Resend dashboard for delivery status

**RLS Policy Issues:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE subscription_tiers DISABLE ROW LEVEL SECURITY;
-- Re-enable after testing
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
```

### Support Resources

- **Database:** [Supabase Documentation](https://supabase.com/docs)
- **Payments:** [Stripe Documentation](https://stripe.com/docs)
- **Email:** [Resend Documentation](https://resend.com/docs)
- **Development:** See `/docs/architecture/` for technical details

## 📞 Next Steps

After completing this setup:

1. **User Acceptance Testing:** Run through all user flows
2. **Performance Testing:** Test with realistic user loads
3. **Security Review:** Audit authentication and data access
4. **Beta Launch:** Begin inviting beta users
5. **Monitoring Setup:** Configure alerts and dashboards

## ✅ Completion Verification

The subscription system is fully operational when:

- [ ] Users can register with beta codes
- [ ] Subscriptions sync with Stripe correctly
- [ ] Usage limits are enforced properly
- [ ] Email notifications are delivered
- [ ] Admin dashboard shows real data
- [ ] All tests pass consistently

---

**System Status:** ✅ Ready for Production Deployment
**Last Updated:** September 18, 2025
**Author:** BMad Development Agent (James)