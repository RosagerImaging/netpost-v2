import { test, expect } from '@playwright/test';

/**
 * Complete Sourcing Flow E2E Tests
 * Tests the entire user journey from registration to sourcing items
 */
test.describe('Complete Sourcing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('User can complete full sourcing workflow from registration to inventory', async ({ page }) => {
    // Step 1: User Registration
    await test.step('User registers for new account', async () => {
      await page.click('[data-testid="get-started-button"]');
      await expect(page).toHaveURL(/.*auth\/signup/);

      await page.fill('[data-testid="email"]', `test-${Date.now()}@netpost.app`);
      await page.fill('[data-testid="password"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password"]', 'TestPassword123!');
      await page.click('[data-testid="signup-button"]');

      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard');
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
    });

    // Step 2: Navigate to Sourcing
    await test.step('User navigates to sourcing section', async () => {
      await page.click('[data-testid="nav-sourcing"]');
      await expect(page).toHaveURL(/.*sourcing/);
      await expect(page.locator('[data-testid="sourcing-header"]')).toBeVisible();
    });

    // Step 3: Add New Sourcing Item
    await test.step('User adds new sourcing item', async () => {
      await page.click('[data-testid="add-sourcing-item"]');

      // Fill item details
      await page.fill('[data-testid="item-title"]', 'Vintage Camera Test Item');
      await page.fill('[data-testid="item-description"]', 'High-quality vintage camera in excellent condition');
      await page.selectOption('[data-testid="item-category"]', 'Electronics');
      await page.fill('[data-testid="purchase-price"]', '45.00');
      await page.fill('[data-testid="estimated-value"]', '85.00');

      // Upload test image (if file upload is implemented)
      if (await page.locator('[data-testid="image-upload"]').isVisible()) {
        await page.setInputFiles('[data-testid="image-upload"]', './tests/fixtures/test-camera.jpg');
      }

      // Save item
      await page.click('[data-testid="save-sourcing-item"]');
      await expect(page.locator('[data-testid="item-saved-toast"]')).toBeVisible();
    });

    // Step 4: Move to Inventory
    await test.step('User moves item to inventory', async () => {
      await page.click('[data-testid="move-to-inventory"]');
      await expect(page.locator('[data-testid="moved-to-inventory-toast"]')).toBeVisible();

      // Navigate to inventory
      await page.click('[data-testid="nav-inventory"]');
      await expect(page).toHaveURL(/.*inventory/);

      // Verify item appears in inventory
      await expect(page.locator('[data-testid="inventory-item"]').first()).toBeVisible();
      await expect(page.locator('text=Vintage Camera Test Item')).toBeVisible();
    });

    // Step 5: Verify Item Details
    await test.step('User can view and edit item details', async () => {
      await page.click('[data-testid="inventory-item"]').first();
      await expect(page.locator('[data-testid="item-detail-modal"]')).toBeVisible();

      // Check details are preserved
      await expect(page.locator('[data-testid="item-title-display"]')).toContainText('Vintage Camera Test Item');
      await expect(page.locator('[data-testid="purchase-price-display"]')).toContainText('$45.00');
      await expect(page.locator('[data-testid="estimated-value-display"]')).toContainText('$85.00');

      // Close modal
      await page.click('[data-testid="close-item-modal"]');
    });
  });

  test('User can source multiple items and organize inventory', async ({ page }) => {
    // Use existing auth state
    await page.goto('/sourcing');

    await test.step('User adds multiple sourcing items', async () => {
      const items = [
        { title: 'Designer Handbag', category: 'Fashion', price: '120.00', value: '250.00' },
        { title: 'Collectible Figurine', category: 'Collectibles', price: '25.00', value: '75.00' },
        { title: 'Vintage Watch', category: 'Jewelry', price: '200.00', value: '450.00' }
      ];

      for (const item of items) {
        await page.click('[data-testid="add-sourcing-item"]');
        await page.fill('[data-testid="item-title"]', item.title);
        await page.selectOption('[data-testid="item-category"]', item.category);
        await page.fill('[data-testid="purchase-price"]', item.price);
        await page.fill('[data-testid="estimated-value"]', item.value);
        await page.click('[data-testid="save-sourcing-item"]');
        await page.waitForSelector('[data-testid="item-saved-toast"]');
      }
    });

    await test.step('User filters and sorts inventory', async () => {
      await page.click('[data-testid="nav-inventory"]');

      // Test category filter
      await page.selectOption('[data-testid="category-filter"]', 'Fashion');
      await expect(page.locator('text=Designer Handbag')).toBeVisible();
      await expect(page.locator('text=Collectible Figurine')).not.toBeVisible();

      // Clear filter
      await page.selectOption('[data-testid="category-filter"]', 'All');

      // Test sorting
      await page.click('[data-testid="sort-by-value"]');
      const firstItem = page.locator('[data-testid="inventory-item"]').first();
      await expect(firstItem).toContainText('Vintage Watch'); // Highest value should be first
    });
  });

  test('User can track profitability across sourcing workflow', async ({ page }) => {
    await page.goto('/sourcing');

    await test.step('User adds item with profit tracking', async () => {
      await page.click('[data-testid="add-sourcing-item"]');
      await page.fill('[data-testid="item-title"]', 'Profit Tracking Test Item');
      await page.selectOption('[data-testid="item-category"]', 'Electronics');
      await page.fill('[data-testid="purchase-price"]', '50.00');
      await page.fill('[data-testid="estimated-value"]', '100.00');
      await page.fill('[data-testid="condition-notes"]', 'Excellent condition, original packaging');

      await page.click('[data-testid="save-sourcing-item"]');
      await page.waitForSelector('[data-testid="item-saved-toast"]');
    });

    await test.step('User views profit calculations', async () => {
      // Check profit display in sourcing view
      await expect(page.locator('[data-testid="estimated-profit"]')).toContainText('$50.00');
      await expect(page.locator('[data-testid="profit-margin"]')).toContainText('50%');

      // Move to inventory and verify profit tracking continues
      await page.click('[data-testid="move-to-inventory"]');
      await page.click('[data-testid="nav-inventory"]');

      await page.click('[data-testid="inventory-item"]').first();
      await expect(page.locator('[data-testid="potential-profit"]')).toContainText('$50.00');
    });
  });

  test('Sourcing workflow handles edge cases and validation', async ({ page }) => {
    await page.goto('/sourcing');

    await test.step('Form validation prevents invalid submissions', async () => {
      await page.click('[data-testid="add-sourcing-item"]');

      // Try to save without required fields
      await page.click('[data-testid="save-sourcing-item"]');
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();

      // Invalid price format
      await page.fill('[data-testid="item-title"]', 'Test Item');
      await page.fill('[data-testid="purchase-price"]', 'invalid-price');
      await page.click('[data-testid="save-sourcing-item"]');
      await expect(page.locator('[data-testid="price-validation-error"]')).toBeVisible();
    });

    await test.step('User can save draft and continue later', async () => {
      // Fill partial form
      await page.fill('[data-testid="item-title"]', 'Draft Item');
      await page.fill('[data-testid="purchase-price"]', '25.00');

      // Save as draft
      await page.click('[data-testid="save-as-draft"]');
      await expect(page.locator('[data-testid="draft-saved-toast"]')).toBeVisible();

      // Navigate away and back
      await page.click('[data-testid="nav-dashboard"]');
      await page.click('[data-testid="nav-sourcing"]');

      // Verify draft is preserved
      await expect(page.locator('[data-testid="draft-item"]')).toBeVisible();
      await expect(page.locator('text=Draft Item')).toBeVisible();
    });
  });
});