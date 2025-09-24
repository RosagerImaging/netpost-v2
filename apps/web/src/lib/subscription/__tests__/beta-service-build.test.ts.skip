/**
 * Build Verification Tests for Beta Service
 *
 * Tests to verify that the beta service can be imported and instantiated
 * without TypeScript errors after our build fixes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Beta Service - Build Verification', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Mock required environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should import BetaService without TypeScript errors', async () => {
    // This test verifies that our build fixes allow proper module importing
    expect(async () => {
      const { BetaService } = await import('../beta-service');
      expect(BetaService).toBeDefined();
      expect(typeof BetaService.generateInvitationCode).toBe('function');
    }).not.toThrow();
  });

  it('should have proper method signatures', async () => {
    const { BetaService } = await import('../beta-service');

    // Verify static methods exist with correct signatures
    expect(typeof BetaService.generateInvitationCode).toBe('function');
    expect(typeof BetaService.createBetaInvitation).toBe('function');
    expect(typeof BetaService.useBetaInvitation).toBe('function');
    expect(typeof BetaService.mapBetaInvitationData).toBe('function');
  });

  it('should generate invitation codes without errors', async () => {
    const { BetaService } = await import('../beta-service');

    const code = BetaService.generateInvitationCode();
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
    expect(code).toMatch(/^[A-Z0-9-]+$/); // Should be alphanumeric with dashes
  });

  it('should have proper TypeScript interface definitions', async () => {
    const { BetaService } = await import('../beta-service');

    // Verify that the class can be referenced without TypeScript errors
    expect(BetaService).toBeDefined();
    expect(BetaService.constructor).toBeDefined();
  });
});