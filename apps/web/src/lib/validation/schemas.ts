/**
 * Validation Schemas for API Routes
 * 
 * Centralized validation using Zod for all API endpoints
 * SECURITY: All user input must be validated before processing
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const urlSchema = z.string().url('Invalid URL format');

// ============================================================================
// Delisting API Schemas
// ============================================================================

export const processJobRequestSchema = z.object({
  jobId: uuidSchema,
});

export const testSaleDetectionRequestSchema = z.object({
  platform: z.enum(['ebay', 'poshmark', 'mercari', 'depop', 'grailed', 'facebook']),
  listingId: z.string().min(1, 'Listing ID is required'),
  salePrice: z.number().positive('Sale price must be positive').optional(),
  buyerUsername: z.string().optional(),
});

// ============================================================================
// Notification API Schemas
// ============================================================================

export const notificationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  unreadOnly: z.coerce.boolean().default(false),
});

export const markNotificationReadSchema = z.object({
  notificationId: uuidSchema,
});

export const markAllNotificationsReadSchema = z.object({
  before: z.string().datetime().optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate request body against a schema
 * Returns validated data or throws with clear error message
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    throw new Error('Invalid request body');
  }
}

/**
 * Validate URL search params against a schema
 * Returns validated data or throws with clear error message
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(searchParams.entries());
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    throw new Error('Invalid query parameters');
  }
}

/**
 * Validate path parameters against a schema
 * Returns validated data or throws with clear error message
 */
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    throw new Error('Invalid path parameters');
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown, status: number = 400) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  return Response.json({ error: message }, { status });
}

