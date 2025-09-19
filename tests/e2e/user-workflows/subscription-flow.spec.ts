import { test, expect } from '@playwright/test';

/**
 * Subscription Management Flow E2E Tests
 * Tests subscription signup, feature gating, and subscription management
 */
test.describe('Subscription Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Free user encounters feature limits and can upgrade', async ({ page }) => {
    await test.step('Free user signs up and explores features', async () => {
      // Sign up for free account
      await page.click('[data-testid="get-started-free"]');
      await page.fill('[data-testid="email"]', `free-user-${Date.now()}@netpost.app`);
      await page.fill('[data-testid="password"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password"]', 'TestPassword123!');
      await page.click('[data-testid="signup-button"]');

      await page.waitForURL('/dashboard');
      await expect(page.locator('[data-testid="subscription-tier"]')).toContainText('Free');
    });

    await test.step('Free user hits inventory limit', async () => {
      // Navigate to inventory and add items until limit is reached
      await page.click('[data-testid="nav-inventory"]');

      // Check current item count and limit
      await expect(page.locator('[data-testid="inventory-limit-display"]')).toContainText('0 / 10 items');

      // Add items up to the limit
      for (let i = 1; i <= 10; i++) {
        await page.click('[data-testid="add-item-button"]');
        await page.fill('[data-testid="item-title"]', `Test Item ${i}`);
        await page.selectOption('[data-testid="item-category"]', 'Electronics');
        await page.fill('[data-testid="item-price"]', '25.00');
        await page.click('[data-testid="save-item-button"]');
        await page.waitForSelector('[data-testid="item-saved-toast"]');
      }

      // Verify limit reached
      await expect(page.locator('[data-testid="inventory-limit-display"]')).toContainText('10 / 10 items');

      // Try to add one more item
      await page.click('[data-testid="add-item-button"]');
      await expect(page.locator('[data-testid="upgrade-prompt-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-prompt-title"]')).toContainText('Inventory Limit Reached');
    });

    await test.step('User views upgrade options', async () => {
      // Check upgrade options in modal
      await expect(page.locator('[data-testid="basic-plan-option"]')).toBeVisible();
      await expect(page.locator('[data-testid="pro-plan-option"]')).toBeVisible();

      // View plan comparison
      await page.click('[data-testid="compare-plans-button"]');
      await expect(page).toHaveURL(/.*pricing/);

      // Verify plan details
      await expect(page.locator('[data-testid="free-plan"]')).toContainText('10 items');
      await expect(page.locator('[data-testid="basic-plan"]')).toContainText('100 items');
      await expect(page.locator('[data-testid="pro-plan"]')).toContainText('Unlimited items');
    });

    await test.step('User upgrades to Basic plan', async () => {
      // Select Basic plan
      await page.click('[data-testid="select-basic-plan"]');
      await expect(page).toHaveURL(/.*checkout/);

      // Fill payment information (using test payment details)
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/30');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="cardholder-name"]', 'Test User');

      // Complete purchase
      await page.click('[data-testid="complete-purchase"]');

      // Wait for success
      await expect(page.locator('[data-testid="upgrade-success-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-success-toast"]')).toContainText('Successfully upgraded to Basic plan');

      // Verify subscription status
      await page.click('[data-testid="nav-dashboard"]');
      await expect(page.locator('[data-testid="subscription-tier"]')).toContainText('Basic');
    });

    await test.step('User can now access Basic plan features', async () => {
      // Navigate back to inventory
      await page.click('[data-testid="nav-inventory"]');

      // Verify increased limit
      await expect(page.locator('[data-testid="inventory-limit-display"]')).toContainText('10 / 100 items');

      // Can add more items
      await page.click('[data-testid="add-item-button"]');
      await page.fill('[data-testid="item-title"]', 'Post-Upgrade Item');
      await page.selectOption('[data-testid="item-category"]', 'Electronics');
      await page.fill('[data-testid="item-price"]', '35.00');
      await page.click('[data-testid="save-item-button"]');

      await expect(page.locator('[data-testid="item-saved-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="inventory-limit-display"]')).toContainText('11 / 100 items');
    });
  });

  test('Pro user can access all premium features', async ({ page }) => {
    await test.step('User signs up and immediately upgrades to Pro', async () => {
      // Navigate to pricing page
      await page.click('[data-testid="view-pricing"]');
      await page.click('[data-testid="select-pro-plan"]');

      // Sign up during checkout
      await page.fill('[data-testid="checkout-email"]', `pro-user-${Date.now()}@netpost.app`);
      await page.fill('[data-testid="checkout-password"]', 'TestPassword123!');

      // Complete payment
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/30');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.fill('[data-testid="cardholder-name"]', 'Pro User');

      await page.click('[data-testid="complete-purchase"]');
      await page.waitForURL('/dashboard');

      await expect(page.locator('[data-testid="subscription-tier"]')).toContainText('Pro');
    });

    await test.step('Pro user can access advanced analytics', async () => {
      // Navigate to analytics (Pro feature)
      await page.click('[data-testid="nav-analytics"]');
      await expect(page).toHaveURL(/.*analytics/);

      // Verify Pro analytics features are available
      await expect(page.locator('[data-testid="advanced-profit-analytics"]')).toBeVisible();
      await expect(page.locator('[data-testid="marketplace-performance-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="inventory-turnover-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="seasonal-trends-analysis"]')).toBeVisible();
    });

    await test.step('Pro user can use bulk operations', async () => {
      // Navigate to inventory
      await page.click('[data-testid="nav-inventory"]');

      // Bulk operations should be available
      await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible();

      // Select multiple items
      await page.check('[data-testid="select-all-items"]');
      await page.click('[data-testid="bulk-actions-menu"]');

      // Verify Pro bulk features
      await expect(page.locator('[data-testid="bulk-price-update"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-marketplace-sync"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-export-data"]')).toBeVisible();
    });

    await test.step('Pro user can access API and integrations', async () => {
      // Navigate to integrations settings
      await page.click('[data-testid="nav-settings"]');
      await page.click('[data-testid="integrations-tab"]');

      // Verify Pro integration features
      await expect(page.locator('[data-testid="api-key-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="webhook-configuration"]')).toBeVisible();
      await expect(page.locator('[data-testid="third-party-integrations"]')).toBeVisible();

      // Generate API key
      await page.click('[data-testid="generate-api-key"]');
      await expect(page.locator('[data-testid="api-key-generated"]')).toBeVisible();
    });
  });

  test('User can manage subscription and billing', async ({ page }) => {
    // Start with existing Pro subscription
    await page.goto('/dashboard');

    await test.step('User can view subscription details', async () => {
      await page.click('[data-testid="nav-settings"]');
      await page.click('[data-testid="subscription-tab"]');

      // Verify subscription information
      await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro Plan');
      await expect(page.locator('[data-testid="billing-cycle"]')).toContainText('Monthly');
      await expect(page.locator('[data-testid="next-billing-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="subscription-price"]')).toContainText('$29.99');
    });

    await test.step('User can view billing history', async () => {
      await page.click('[data-testid="billing-history-tab"]');

      // Verify billing records
      await expect(page.locator('[data-testid="billing-record"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="invoice-download"]').first()).toBeVisible();

      // Download invoice
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="invoice-download"]').first();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('invoice');
    });

    await test.step('User can update payment method', async () => {
      await page.click('[data-testid="payment-methods-tab"]');

      // Add new payment method
      await page.click('[data-testid="add-payment-method"]');
      await page.fill('[data-testid="new-card-number"]', '4000000000000002');
      await page.fill('[data-testid="new-card-expiry"]', '06/28');
      await page.fill('[data-testid="new-card-cvc"]', '456');
      await page.click('[data-testid="save-payment-method"]');

      await expect(page.locator('[data-testid="payment-method-added"]')).toBeVisible();

      // Set as default payment method
      await page.click('[data-testid="set-default-payment"]');
      await expect(page.locator('[data-testid="default-payment-updated"]')).toBeVisible();
    });

    await test.step('User can change subscription plan', async () => {
      await page.click('[data-testid="subscription-tab"]');
      await page.click('[data-testid="change-plan-button"]');

      // Downgrade to Basic
      await page.click('[data-testid="select-basic-plan"]');
      await page.click('[data-testid="confirm-plan-change"]');

      // Handle pro-ration dialog
      await expect(page.locator('[data-testid="proration-dialog"]')).toBeVisible();
      await page.click('[data-testid="confirm-proration"]');

      await expect(page.locator('[data-testid="plan-change-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-plan"]')).toContainText('Basic Plan');
    });

    await test.step('User can cancel subscription', async () => {
      await page.click('[data-testid="cancel-subscription-button"]');

      // Cancellation flow
      await expect(page.locator('[data-testid="cancellation-dialog"]')).toBeVisible();
      await page.selectOption('[data-testid="cancellation-reason"]', 'Too expensive');
      await page.fill('[data-testid="cancellation-feedback"]', 'Looking for a more affordable solution');

      // Offer retention options
      await expect(page.locator('[data-testid="retention-offer"]')).toBeVisible();
      await page.click('[data-testid="decline-retention-offer"]');

      // Confirm cancellation
      await page.check('[data-testid="confirm-cancellation-checkbox"]');
      await page.click('[data-testid="final-cancel-button"]');

      await expect(page.locator('[data-testid="cancellation-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancellation-success"]')).toContainText('Subscription will end on');

      // Verify account status
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Cancelled');
    });
  });

  test('Feature gating works correctly across subscription tiers', async ({ page }) => {
    await test.step('Free tier feature restrictions', async () => {
      // Test with free account
      await page.goto('/dashboard');

      // Analytics should be limited
      await page.click('[data-testid="nav-analytics"]');
      await expect(page.locator('[data-testid="basic-analytics-only"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-for-advanced-analytics"]')).toBeVisible();

      // Bulk operations should be limited
      await page.click('[data-testid="nav-inventory"]');
      await expect(page.locator('[data-testid="bulk-actions-upgrade-prompt"]')).toBeVisible();

      // Marketplace integrations should be limited
      await page.click('[data-testid="nav-settings"]');
      await page.click('[data-testid="integrations-tab"]');
      await expect(page.locator('[data-testid="basic-integrations-only"]')).toBeVisible();
    });

    await test.step('Feature unlocking after upgrade', async () => {
      // Upgrade to Basic plan
      await page.click('[data-testid="upgrade-to-basic"]');
      // ... complete upgrade flow ...

      // Previously restricted features should now be available
      await page.click('[data-testid="nav-inventory"]');
      await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible();

      // Some Pro features should still be restricted
      await page.click('[data-testid="nav-analytics"]');
      await expect(page.locator('[data-testid="basic-analytics"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-for-pro-analytics"]')).toBeVisible();
    });
  });
});