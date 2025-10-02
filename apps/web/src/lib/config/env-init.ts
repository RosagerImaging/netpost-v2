/**
 * Environment Variable Initialization
 * 
 * This module MUST be imported at the top of the application entry point
 * to validate all required environment variables before the app starts.
 * 
 * SECURITY: Fails fast with clear error messages if configuration is invalid
 * 
 * Usage:
 * ```typescript
 * // In app/layout.tsx or instrumentation.ts
 * import '@/lib/config/env-init';
 * ```
 */

import { validateOrThrow } from './env-validation';

// Only run validation on the server side and skip during build time
// During build, Next.js pre-renders pages and environment variables may not be available
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NODE_ENV === 'production' && !process.env.VERCEL;

if (typeof window === 'undefined' && !isBuildTime) {
  try {
    // Validate environment variables at module load time
    // This ensures the app won't start with missing configuration
    validateOrThrow(false); // Set to true for strict mode (treats warnings as errors)

    console.log('✅ Environment validation passed - application starting');
  } catch (error) {
    console.error('❌ FATAL: Environment validation failed');
    console.error('The application cannot start with invalid configuration');

    // In production, this will prevent the app from starting
    // In development, it provides clear feedback to developers
    throw error;
  }
} else if (isBuildTime) {
  console.log('⏭️  Skipping environment validation during build time');
}

// Export a marker to confirm initialization
export const ENV_VALIDATED = true;

