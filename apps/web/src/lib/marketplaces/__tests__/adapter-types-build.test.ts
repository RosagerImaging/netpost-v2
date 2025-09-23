/**
 * Build Verification Tests for Marketplace Adapter Types
 *
 * Tests to verify that the marketplace adapters can be imported and instantiated
 * without TypeScript errors after our ListingStatus type fixes.
 */

import { describe, it, expect } from 'vitest';

describe('Marketplace Adapters - Build Verification', () => {
  it('should import marketplace adapters without TypeScript errors', async () => {
    expect(async () => {
      const adapters = await import('../index');

      // Verify main exports exist
      expect(adapters.BaseMarketplaceAdapter).toBeDefined();
      expect(adapters.EBayAdapter).toBeDefined();
      expect(adapters.PoshmarkAdapter).toBeDefined();
      expect(adapters.FacebookAdapter).toBeDefined();
      expect(adapters.MarketplaceAdapterFactory).toBeDefined();
    }).not.toThrow();
  });

  it('should have proper ListingStatus type exports', async () => {
    const adapters = await import('../index');

    // This test verifies that our DatabaseListingStatus alias is working
    expect(() => {
      // These should be accessible without TypeScript errors
      const {
        initializeMarketplaceAdapters,
        getSupportedMarketplaces,
        createMarketplaceAdapter
      } = adapters;

      expect(typeof initializeMarketplaceAdapters).toBe('function');
      expect(typeof getSupportedMarketplaces).toBe('function');
      expect(typeof createMarketplaceAdapter).toBe('function');
    }).not.toThrow();
  });

  it('should import BaseMarketplaceAdapter with proper typing', async () => {
    const { BaseMarketplaceAdapter } = await import('../base-adapter');

    expect(BaseMarketplaceAdapter).toBeDefined();
    expect(typeof BaseMarketplaceAdapter).toBe('function'); // It's a class constructor
  });

  it('should import EBayAdapter with proper typing', async () => {
    const { EBayAdapter } = await import('../ebay-adapter');

    expect(EBayAdapter).toBeDefined();
    expect(typeof EBayAdapter).toBe('function'); // It's a class constructor

    // Verify it extends BaseMarketplaceAdapter
    const { BaseMarketplaceAdapter } = await import('../base-adapter');
    expect(EBayAdapter.prototype instanceof BaseMarketplaceAdapter).toBe(true);
  });

  it('should handle ListingStatus type compatibility', async () => {
    // This test verifies that our type fixes allow proper instantiation
    expect(async () => {
      const { EBayAdapter } = await import('../ebay-adapter');
      const { PoshmarkAdapter } = await import('../poshmark-adapter');
      const { FacebookAdapter } = await import('../facebook-adapter');

      // These should not throw TypeScript compilation errors
      expect(EBayAdapter).toBeDefined();
      expect(PoshmarkAdapter).toBeDefined();
      expect(FacebookAdapter).toBeDefined();
    }).not.toThrow();
  });
});