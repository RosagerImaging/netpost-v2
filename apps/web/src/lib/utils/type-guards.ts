/**
 * Type Guard Utilities
 * 
 * Provides runtime type validation to ensure type safety beyond TypeScript's
 * compile-time checks. Essential for validating external data, API responses,
 * and user inputs.
 * 
 * SECURITY: Never trust external data - always validate at runtime
 */

import type { AuthUser } from '../../../lib/auth/types';
import type { User } from '@supabase/supabase-js';

/**
 * Type guard for checking if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard for checking if a value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard for checking if a value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard for Supabase User to AuthUser conversion
 * Validates that the user object has all required fields
 */
export function isAuthUser(user: unknown): user is AuthUser {
  if (!isObject(user)) {
    return false;
  }

  // Check required fields
  const hasId = 'id' in user && isNonEmptyString(user.id);
  const hasEmail = 'email' in user && (user.email === null || isNonEmptyString(user.email));
  
  // Optional fields validation
  const hasValidCreatedAt = !('created_at' in user) || isNonEmptyString(user.created_at);
  const hasValidUpdatedAt = !('updated_at' in user) || isNonEmptyString(user.updated_at);

  return hasId && hasEmail && hasValidCreatedAt && hasValidUpdatedAt;
}

/**
 * Safely convert Supabase User to AuthUser with validation
 * Returns null if validation fails
 */
export function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) {
    return null;
  }

  if (!isAuthUser(user)) {
    console.warn('Invalid user object received:', {
      hasId: 'id' in user,
      hasEmail: 'email' in user,
      type: typeof user,
    });
    return null;
  }

  return user as AuthUser;
}

/**
 * Type guard for checking if an error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard for checking if an error has a specific property
 */
export function hasErrorMessage(error: unknown): error is { message: string } {
  return isObject(error) && 'message' in error && isNonEmptyString(error.message);
}

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (hasErrorMessage(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Type guard for checking if a value is an array of a specific type
 */
export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

/**
 * Type guard for checking if a value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  property: K
): value is Record<K, unknown> {
  return isObject(value) && property in value;
}

/**
 * Type guard for checking if a value has multiple properties
 */
export function hasProperties<K extends string>(
  value: unknown,
  properties: K[]
): value is Record<K, unknown> {
  return isObject(value) && properties.every(prop => prop in value);
}

/**
 * Assert that a value is defined (not null or undefined)
 * Throws an error if the value is null or undefined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value must be defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Assert that a condition is true
 * Throws an error if the condition is false
 */
export function assert(
  condition: boolean,
  message = 'Assertion failed'
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Narrow unknown to a specific type with a type guard
 * Returns null if the guard fails
 */
export function narrow<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): T | null {
  return guard(value) ? value : null;
}

/**
 * Type guard for checking if a value is a valid UUID
 */
export function isUUID(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Type guard for checking if a value is a valid email
 */
export function isEmail(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }
  
  // Basic email validation - for production use a more robust library
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Type guard for checking if a value is a valid URL
 */
export function isURL(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }
  
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for checking if a value is within a range
 */
export function isInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return isValidNumber(value) && value >= min && value <= max;
}

/**
 * Type guard for checking if a value is one of a set of literal values
 */
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  options: T
): value is T[number] {
  return options.includes(value);
}

/**
 * Exhaustiveness check for switch statements
 * Ensures all cases are handled in discriminated unions
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

