import { test, expect } from '@playwright/test';

/**
 * Cross-Platform Listing Flow E2E Tests
 * Tests the complete flow from inventory item to multiple marketplace listings
 */
test.describe('Cross-Platform Listing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate and navigate to inventory
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('User can create listings across multiple marketplaces', async ({ page }) => {
    await test.step('User selects item to list', async () => {
      // Ensure there's at least one inventory item
      await expect(page.locator('[data-testid="inventory-item"]').first()).toBeVisible();

      // Select item for listing
      await page.click('[data-testid="inventory-item"]').first();
      await page.click('[data-testid="create-listing-button"]');

      await expect(page).toHaveURL(/.*create-listing/);
      await expect(page.locator('[data-testid="listing-form"]')).toBeVisible();
    });

    await test.step('User configures eBay listing', async () => {
      // Select eBay marketplace
      await page.check('[data-testid="marketplace-ebay"]');

      // Configure eBay-specific settings
      await page.selectOption('[data-testid="ebay-category"]', 'Electronics');
      await page.selectOption('[data-testid="ebay-condition"]', 'Used');
      await page.fill('[data-testid="ebay-listing-price"]', '89.99');
      await page.selectOption('[data-testid="ebay-listing-type"]', 'FixedPrice');
      await page.fill('[data-testid="ebay-shipping-cost"]', '8.50');

      // Add eBay-specific description
      await page.fill('[data-testid="ebay-description"]',
        'Excellent condition vintage camera. Tested and working perfectly. Ships with original case.');
    });

    await test.step('User configures Poshmark listing', async () => {
      // Select Poshmark marketplace
      await page.check('[data-testid="marketplace-poshmark"]');

      // Configure Poshmark-specific settings
      await page.selectOption('[data-testid="poshmark-category"]', 'Electronics');
      await page.fill('[data-testid="poshmark-listing-price"]', '95.00');
      await page.selectOption('[data-testid="poshmark-size"]', 'Not Applicable');
      await page.selectOption('[data-testid="poshmark-brand"]', 'Other');

      // Add Poshmark hashtags
      await page.fill('[data-testid="poshmark-tags"]', '#vintage #camera #photography #retro');
    });

    await test.step('User configures Facebook Marketplace listing', async () => {
      // Select Facebook Marketplace
      await page.check('[data-testid="marketplace-facebook"]');

      // Configure Facebook-specific settings
      await page.selectOption('[data-testid="facebook-category"]', 'Electronics');
      await page.fill('[data-testid="facebook-listing-price"]', '85.00');
      await page.selectOption('[data-testid="facebook-condition"]', 'Good');
      await page.fill('[data-testid="facebook-location"]', 'Local Pickup Available');
    });

    await test.step('User reviews and publishes listings', async () => {
      // Review all marketplace configurations
      await page.click('[data-testid="review-listings-button"]');

      await expect(page.locator('[data-testid="ebay-listing-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="poshmark-listing-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="facebook-listing-preview"]')).toBeVisible();

      // Verify pricing strategy
      await expect(page.locator('[data-testid="pricing-summary"]')).toContainText('eBay: $89.99');
      await expect(page.locator('[data-testid="pricing-summary"]')).toContainText('Poshmark: $95.00');
      await expect(page.locator('[data-testid="pricing-summary"]')).toContainText('Facebook: $85.00');

      // Publish to all marketplaces
      await page.click('[data-testid="publish-all-listings"]');

      // Wait for success confirmation
      await expect(page.locator('[data-testid="listings-published-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="listings-published-toast"]')).toContainText('3 listings published successfully');
    });

    await test.step('User verifies listings in dashboard', async () => {
      await page.click('[data-testid="nav-listings"]');

      // Verify all listings appear in dashboard
      await expect(page.locator('[data-testid="active-listing"][data-marketplace="ebay"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-listing"][data-marketplace="poshmark"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-listing"][data-marketplace="facebook"]')).toBeVisible();

      // Check listing statuses
      await expect(page.locator('[data-testid="listing-status-ebay"]')).toContainText('Active');
      await expect(page.locator('[data-testid="listing-status-poshmark"]')).toContainText('Active');
      await expect(page.locator('[data-testid="listing-status-facebook"]')).toContainText('Active');
    });
  });

  test('User can manage pricing strategy across marketplaces', async ({ page }) => {
    await test.step('User creates listings with different pricing strategies', async () => {
      await page.click('[data-testid="inventory-item"]').first();
      await page.click('[data-testid="create-listing-button"]');

      // Enable automatic pricing strategy
      await page.check('[data-testid="auto-pricing-enabled"]');
      await page.fill('[data-testid="base-price"]', '100.00');
      await page.selectOption('[data-testid="pricing-strategy"]', 'competitive');

      // Set marketplace-specific adjustments
      await page.fill('[data-testid="ebay-price-adjustment"]', '-5'); // 5% lower for eBay fees
      await page.fill('[data-testid="poshmark-price-adjustment"]', '+10'); // 10% higher for Poshmark audience
      await page.fill('[data-testid="facebook-price-adjustment"]', '-10'); // 10% lower for local sales

      await page.click('[data-testid="calculate-prices"]');

      // Verify calculated prices
      await expect(page.locator('[data-testid="calculated-ebay-price"]')).toContainText('$95.00');
      await expect(page.locator('[data-testid="calculated-poshmark-price"]')).toContainText('$110.00');
      await expect(page.locator('[data-testid="calculated-facebook-price"]')).toContainText('$90.00');
    });

    await test.step('User can update pricing across all marketplaces', async () => {
      // Navigate to listings management
      await page.click('[data-testid="nav-listings"]');

      // Select item to update pricing
      await page.click('[data-testid="listing-actions-menu"]').first();
      await page.click('[data-testid="update-pricing"]');

      // Update base price
      await page.fill('[data-testid="new-base-price"]', '120.00');
      await page.click('[data-testid="apply-to-all-marketplaces"]');

      // Confirm bulk price update
      await page.click('[data-testid="confirm-price-update"]');

      await expect(page.locator('[data-testid="price-update-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="price-update-success"]')).toContainText('Prices updated across 3 marketplaces');
    });
  });

  test('User can handle marketplace-specific requirements and validation', async ({ page }) => {
    await test.step('System validates marketplace-specific requirements', async () => {
      await page.click('[data-testid="inventory-item"]').first();
      await page.click('[data-testid="create-listing-button"]');

      // Try to create eBay listing without required fields
      await page.check('[data-testid="marketplace-ebay"]');
      await page.click('[data-testid="publish-listing"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="ebay-validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="ebay-validation-error"]')).toContainText('Category is required for eBay listings');

      // Fill required fields
      await page.selectOption('[data-testid="ebay-category"]', 'Electronics');
      await page.selectOption('[data-testid="ebay-condition"]', 'Used');

      // Validation errors should disappear
      await expect(page.locator('[data-testid="ebay-validation-error"]')).not.toBeVisible();
    });

    await test.step('User can preview listings before publishing', async () => {
      // Configure all marketplace settings
      await page.check('[data-testid="marketplace-ebay"]');
      await page.check('[data-testid="marketplace-poshmark"]');
      await page.check('[data-testid="marketplace-facebook"]');

      // Fill required fields for all marketplaces
      await page.fill('[data-testid="listing-title"]', 'Professional Camera Equipment');
      await page.fill('[data-testid="listing-description"]', 'High-quality camera in excellent condition');

      // Generate previews
      await page.click('[data-testid="generate-previews"]');

      // Verify previews show marketplace-specific formatting
      await expect(page.locator('[data-testid="ebay-preview"]')).toContainText('Professional Camera Equipment');
      await expect(page.locator('[data-testid="poshmark-preview"]')).toContainText('#camera');
      await expect(page.locator('[data-testid="facebook-preview"]')).toContainText('Local Pickup');

      // User can edit previews
      await page.click('[data-testid="edit-ebay-preview"]');
      await page.fill('[data-testid="ebay-title-override"]', 'Professional Camera Equipment - Fast Shipping!');
      await page.click('[data-testid="save-preview-changes"]');

      await expect(page.locator('[data-testid="ebay-preview"]')).toContainText('Fast Shipping!');
    });
  });

  test('Cross-listing workflow handles errors and retries', async ({ page }) => {
    await test.step('System handles marketplace API failures gracefully', async () => {
      // Mock API failure scenario (this would be implemented with proper API mocking)
      await page.goto('/inventory');
      await page.click('[data-testid="inventory-item"]').first();
      await page.click('[data-testid="create-listing-button"]');

      // Configure listings
      await page.check('[data-testid="marketplace-ebay"]');
      await page.check('[data-testid="marketplace-poshmark"]');

      // Simulate API failure by intercepting network requests
      await page.route('**/api/listings/ebay', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'eBay API temporarily unavailable' })
        });
      });

      await page.click('[data-testid="publish-all-listings"]');

      // Should show partial success message
      await expect(page.locator('[data-testid="partial-success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="partial-success-toast"]')).toContainText('1 of 2 listings published');

      // Should show retry option for failed listings
      await expect(page.locator('[data-testid="retry-failed-listings"]')).toBeVisible();
    });

    await test.step('User can retry failed listings', async () => {
      // Click retry button
      await page.click('[data-testid="retry-failed-listings"]');

      // Remove API failure mock
      await page.unroute('**/api/listings/ebay');

      // Retry should succeed
      await expect(page.locator('[data-testid="retry-success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-success-toast"]')).toContainText('All listings published successfully');
    });
  });

  test('User can manage bulk listing operations', async ({ page }) => {
    await test.step('User can select multiple items for bulk listing', async () => {
      await page.goto('/inventory');

      // Select multiple inventory items
      await page.check('[data-testid="select-item-1"]');
      await page.check('[data-testid="select-item-2"]');
      await page.check('[data-testid="select-item-3"]');

      // Open bulk actions menu
      await page.click('[data-testid="bulk-actions-menu"]');
      await page.click('[data-testid="bulk-create-listings"]');

      await expect(page).toHaveURL(/.*bulk-listing/);
      await expect(page.locator('[data-testid="selected-items-count"]')).toContainText('3 items selected');
    });

    await test.step('User can apply common settings to all selected items', async () => {
      // Apply common marketplace settings
      await page.check('[data-testid="apply-to-all-ebay"]');
      await page.check('[data-testid="apply-to-all-poshmark"]');

      // Set common pricing strategy
      await page.selectOption('[data-testid="bulk-pricing-strategy"]', 'premium');
      await page.fill('[data-testid="bulk-markup-percentage"]', '40');

      // Apply common condition
      await page.selectOption('[data-testid="bulk-condition"]', 'Good');

      // Preview bulk settings
      await page.click('[data-testid="preview-bulk-listings"]');

      // Verify settings applied to all items
      await expect(page.locator('[data-testid="bulk-preview-item"]')).toHaveCount(3);
      await expect(page.locator('[data-testid="ebay-enabled"]')).toHaveCount(3);
      await expect(page.locator('[data-testid="poshmark-enabled"]')).toHaveCount(3);
    });

    await test.step('User can customize individual items within bulk operation', async () => {
      // Customize specific item
      await page.click('[data-testid="customize-item-2"]');

      // Override pricing for this item
      await page.fill('[data-testid="item-2-custom-price"]', '150.00');
      await page.selectOption('[data-testid="item-2-custom-category"]', 'Luxury');

      // Save customization
      await page.click('[data-testid="save-item-customization"]');

      // Publish all listings
      await page.click('[data-testid="publish-bulk-listings"]');

      await expect(page.locator('[data-testid="bulk-publish-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-publish-success"]')).toContainText('6 listings published successfully');
    });
  });
});