/**
 * Centralized environment variable validation
 * Validates all required environment variables at startup
 * Fails fast with clear error messages if any are missing
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
  category: 'database' | 'auth' | 'webhooks' | 'api' | 'payment' | 'other';
}

const ENV_VARS: EnvVarConfig[] = [
  // Database
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    category: 'database',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
    category: 'database',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-side only)',
    category: 'database',
  },

  // Auth
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth secret for session encryption',
    category: 'auth',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'NextAuth base URL',
    category: 'auth',
  },

  // Webhook Secrets (only required if marketplace is enabled)
  {
    name: 'EBAY_WEBHOOK_SECRET',
    required: false,
    description: 'eBay webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'POSHMARK_WEBHOOK_SECRET',
    required: false,
    description: 'Poshmark webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'FACEBOOK_WEBHOOK_SECRET',
    required: false,
    description: 'Facebook Marketplace webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'FACEBOOK_WEBHOOK_VERIFY_TOKEN',
    required: false,
    description: 'Facebook webhook verification token',
    category: 'webhooks',
  },
  {
    name: 'MERCARI_WEBHOOK_SECRET',
    required: false,
    description: 'Mercari webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'DEPOP_WEBHOOK_SECRET',
    required: false,
    description: 'Depop webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'VINTED_WEBHOOK_SECRET',
    required: false,
    description: 'Vinted webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'GRAILED_WEBHOOK_SECRET',
    required: false,
    description: 'Grailed webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'THE_REALREAL_WEBHOOK_SECRET',
    required: false,
    description: 'The RealReal webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'VESTIAIRE_WEBHOOK_SECRET',
    required: false,
    description: 'Vestiaire Collective webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'TRADESY_WEBHOOK_SECRET',
    required: false,
    description: 'Tradesy webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'ETSY_WEBHOOK_SECRET',
    required: false,
    description: 'Etsy webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'AMAZON_WEBHOOK_SECRET',
    required: false,
    description: 'Amazon webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'SHOPIFY_WEBHOOK_SECRET',
    required: false,
    description: 'Shopify webhook signature verification secret',
    category: 'webhooks',
  },
  {
    name: 'CUSTOM_WEBHOOK_SECRET',
    required: false,
    description: 'Custom marketplace webhook signature verification secret',
    category: 'webhooks',
  },

  // Payment
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key for payment processing',
    category: 'payment',
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key',
    category: 'payment',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook signature verification secret',
    category: 'payment',
  },

  // Other
  {
    name: 'NODE_ENV',
    required: true,
    description: 'Node environment (development, production, test)',
    category: 'other',
  },
];

interface ValidationResult {
  valid: boolean;
  missing: EnvVarConfig[];
  warnings: string[];
  errors: string[];
}

/**
 * Validate all environment variables
 * @param strict If true, treats warnings as errors
 */
export function validateEnvironmentVariables(strict = false): ValidationResult {
  const missing: EnvVarConfig[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value || value.trim() === '') {
      if (envVar.required) {
        missing.push(envVar);
        errors.push(
          `❌ Missing required environment variable: ${envVar.name}\n` +
          `   Description: ${envVar.description}\n` +
          `   Category: ${envVar.category}`
        );
      } else {
        warnings.push(
          `⚠️  Optional environment variable not set: ${envVar.name}\n` +
          `   Description: ${envVar.description}\n` +
          `   This may limit functionality for ${envVar.category}`
        );
      }
    }
  }

  const valid = errors.length === 0 && (!strict || warnings.length === 0);

  return {
    valid,
    missing,
    warnings,
    errors,
  };
}

/**
 * Validate and throw if invalid
 * Use this at application startup
 */
export function validateOrThrow(strict = false): void {
  const result = validateEnvironmentVariables(strict);

  if (!result.valid) {
    console.error('\n🚨 Environment Variable Validation Failed!\n');
    console.error('='.repeat(60));

    if (result.errors.length > 0) {
      console.error('\nERRORS (Required variables):');
      result.errors.forEach((error) => console.error(error));
    }

    if (strict && result.warnings.length > 0) {
      console.error('\nWARNINGS (Optional variables):');
      result.warnings.forEach((warning) => console.error(warning));
    }

    console.error('\n' + '='.repeat(60));
    console.error('\n💡 Tips:');
    console.error('   1. Copy .env.example to .env.local');
    console.error('   2. Fill in all required values');
    console.error('   3. Restart the application\n');

    throw new Error(
      `Environment validation failed: ${result.errors.length} required variables missing`
    );
  }

  // Log warnings even if not strict
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:\n');
    result.warnings.forEach((warning) => console.warn(warning));
    console.warn('');
  }

  console.log('✅ Environment variables validated successfully');
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(): string {
  const result = validateEnvironmentVariables(false);

  const summary = [
    'Environment Variable Status:',
    `  Total variables: ${ENV_VARS.length}`,
    `  Required: ${ENV_VARS.filter((v) => v.required).length}`,
    `  Optional: ${ENV_VARS.filter((v) => !v.required).length}`,
    `  Missing required: ${result.missing.filter((v) => v.required).length}`,
    `  Missing optional: ${result.missing.filter((v) => !v.required).length}`,
  ];

  return summary.join('\n');
}

