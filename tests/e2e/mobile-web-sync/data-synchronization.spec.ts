import { test, expect, devices } from '@playwright/test';

/**
 * Mobile-Web Data Synchronization E2E Tests
 * Tests real-time sync between mobile and web applications
 */
test.describe('Mobile-Web Data Synchronization', () => {

  test.describe('Mobile Context', () => {
    test.use({ ...devices['iPhone 12'] });

    test('Mobile sourcing syncs to web inventory in real-time', async ({ page, context }) => {
      await test.step('User logs in on mobile device', async () => {
        await page.goto('/auth/login');
        await page.fill('[data-testid="email"]', 'sync-test@netpost.app');
        await page.fill('[data-testid="password"]', 'TestPassword123!');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/dashboard');
      });

      await test.step('User adds item on mobile sourcing', async () => {
        // Navigate to mobile sourcing interface
        await page.click('[data-testid="mobile-nav-sourcing"]');
        await expect(page).toHaveURL(/.*sourcing/);

        // Add new sourcing item
        await page.click('[data-testid="mobile-add-item"]');
        await page.fill('[data-testid="mobile-item-title"]', 'Mobile Sourced Camera');
        await page.fill('[data-testid="mobile-item-description"]', 'Found at estate sale');
        await page.selectOption('[data-testid="mobile-item-category"]', 'Electronics');
        await page.fill('[data-testid="mobile-purchase-price"]', '75.00');
        await page.fill('[data-testid="mobile-estimated-value"]', '150.00');

        // Take photo using mobile camera simulation
        await page.click('[data-testid="mobile-camera-button"]');
        await page.setInputFiles('[data-testid="mobile-photo-input"]', './tests/fixtures/test-camera.jpg');
        await page.click('[data-testid="confirm-photo"]');

        // Save item
        await page.click('[data-testid="mobile-save-item"]');
        await expect(page.locator('[data-testid="mobile-item-saved"]')).toBeVisible();
      });

      await test.step('Verify sync status and open web session', async () => {
        // Check sync indicator
        await expect(page.locator('[data-testid="sync-status"]')).toContainText('Synced');

        // Open new tab for web interface
        const webPage = await context.newPage();
        await webPage.goto('/inventory');
        await webPage.fill('[data-testid="email"]', 'sync-test@netpost.app');
        await webPage.fill('[data-testid="password"]', 'TestPassword123!');
        await webPage.click('[data-testid="login-button"]');
        await webPage.waitForURL('/inventory');

        // Verify item appears in web inventory
        await expect(webPage.locator('[data-testid="inventory-item"]')).toContainText('Mobile Sourced Camera');
        await expect(webPage.locator('[data-testid="item-price"]')).toContainText('$75.00');
        await expect(webPage.locator('[data-testid="item-value"]')).toContainText('$150.00');

        // Verify photo synced
        await webPage.click('[data-testid="inventory-item"]').first();
        await expect(webPage.locator('[data-testid="item-photo"]')).toBeVisible();

        await webPage.close();
      });

      await test.step('User moves item to inventory on mobile', async () => {
        // Move sourced item to inventory
        await page.click('[data-testid="mobile-move-to-inventory"]');
        await expect(page.locator('[data-testid="moved-to-inventory-toast"]')).toBeVisible();

        // Navigate to mobile inventory
        await page.click('[data-testid="mobile-nav-inventory"]');
        await expect(page.locator('[data-testid="mobile-inventory-item"]')).toContainText('Mobile Sourced Camera');
      });
    });

    test('Offline mobile changes sync when connection restored', async ({ page, context }) => {
      await test.step('User goes offline and makes changes', async () => {
        // Login and navigate to sourcing
        await page.goto('/sourcing');

        // Simulate offline state
        await context.setOffline(true);
        await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

        // Add item while offline
        await page.click('[data-testid="mobile-add-item"]');
        await page.fill('[data-testid="mobile-item-title"]', 'Offline Added Item');
        await page.fill('[data-testid="mobile-purchase-price"]', '25.00');
        await page.click('[data-testid="mobile-save-item"]');

        // Should show offline saved indicator
        await expect(page.locator('[data-testid="offline-saved"]')).toBeVisible();
        await expect(page.locator('[data-testid="pending-sync-count"]')).toContainText('1');
      });

      await test.step('Connection restored and changes sync', async () => {
        // Restore online connection
        await context.setOffline(false);
        await page.waitForSelector('[data-testid="online-indicator"]');

        // Should automatically sync pending changes
        await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();
        await expect(page.locator('[data-testid="pending-sync-count"]')).toContainText('0');

        // Verify item synced to server
        const webPage = await context.newPage();
        await webPage.goto('/inventory');
        await expect(webPage.locator('[data-testid="inventory-item"]')).toContainText('Offline Added Item');
        await webPage.close();
      });
    });
  });

  test.describe('Web-Mobile Bidirectional Sync', () => {
    test('Web inventory changes reflect on mobile immediately', async ({ browser }) => {
      // Create two browser contexts for simultaneous testing
      const webContext = await browser.newContext();
      const mobileContext = await browser.newContext({ ...devices['iPhone 12'] });

      const webPage = await webContext.newPage();
      const mobilePage = await mobileContext.newPage();

      await test.step('Setup synchronized sessions', async () => {
        // Login on both devices with same account
        await webPage.goto('/auth/login');
        await webPage.fill('[data-testid="email"]', 'bidirectional-test@netpost.app');
        await webPage.fill('[data-testid="password"]', 'TestPassword123!');
        await webPage.click('[data-testid="login-button"]');
        await webPage.waitForURL('/dashboard');

        await mobilePage.goto('/auth/login');
        await mobilePage.fill('[data-testid="email"]', 'bidirectional-test@netpost.app');
        await mobilePage.fill('[data-testid="password"]', 'TestPassword123!');
        await mobilePage.click('[data-testid="login-button"]');
        await mobilePage.waitForURL('/dashboard');
      });

      await test.step('Web user adds inventory item', async () => {
        await webPage.click('[data-testid="nav-inventory"]');
        await webPage.click('[data-testid="add-item-button"]');
        await webPage.fill('[data-testid="item-title"]', 'Web Added Item');
        await webPage.selectOption('[data-testid="item-category"]', 'Clothing');
        await webPage.fill('[data-testid="item-price"]', '40.00');
        await webPage.click('[data-testid="save-item-button"]');
        await expect(webPage.locator('[data-testid="item-saved-toast"]')).toBeVisible();
      });

      await test.step('Mobile user sees web changes immediately', async () => {
        await mobilePage.click('[data-testid="mobile-nav-inventory"]');

        // Should automatically receive real-time update
        await expect(mobilePage.locator('[data-testid="mobile-inventory-item"]')).toContainText('Web Added Item');
        await expect(mobilePage.locator('[data-testid="mobile-item-price"]')).toContainText('$40.00');
      });

      await test.step('Mobile user edits item details', async () => {
        await mobilePage.click('[data-testid="mobile-inventory-item"]').first();
        await mobilePage.click('[data-testid="mobile-edit-item"]');
        await mobilePage.fill('[data-testid="mobile-item-description"]', 'Added description from mobile');
        await mobilePage.fill('[data-testid="mobile-item-notes"]', 'Mobile edit notes');
        await mobilePage.click('[data-testid="mobile-save-changes"]');
        await expect(mobilePage.locator('[data-testid="mobile-changes-saved"]')).toBeVisible();
      });

      await test.step('Web user sees mobile edits immediately', async () => {
        // Refresh web inventory view
        await webPage.reload();
        await webPage.click('[data-testid="inventory-item"]').first();

        // Should show mobile edits
        await expect(webPage.locator('[data-testid="item-description-display"]')).toContainText('Added description from mobile');
        await expect(webPage.locator('[data-testid="item-notes-display"]')).toContainText('Mobile edit notes');
      });

      await webContext.close();
      await mobileContext.close();
    });
  });

  test.describe('Photo Upload and Sync', () => {
    test.use({ ...devices['Pixel 5'] });

    test('Mobile photo uploads sync to web with optimization', async ({ page, context }) => {
      await test.step('User captures photos on mobile', async () => {
        await page.goto('/sourcing');
        await page.click('[data-testid="mobile-add-item"]');
        await page.fill('[data-testid="mobile-item-title"]', 'Multi-Photo Item');

        // Add multiple photos
        await page.click('[data-testid="mobile-add-photo"]');
        await page.setInputFiles('[data-testid="mobile-photo-input"]', './tests/fixtures/test-item-1.jpg');
        await page.click('[data-testid="confirm-photo"]');

        await page.click('[data-testid="mobile-add-photo"]');
        await page.setInputFiles('[data-testid="mobile-photo-input"]', './tests/fixtures/test-item-2.jpg');
        await page.click('[data-testid="confirm-photo"]');

        await page.click('[data-testid="mobile-add-photo"]');
        await page.setInputFiles('[data-testid="mobile-photo-input"]', './tests/fixtures/test-item-3.jpg');
        await page.click('[data-testid="confirm-photo"]');

        await expect(page.locator('[data-testid="photo-count"]')).toContainText('3 photos');
      });

      await test.step('Photos upload with progress tracking', async () => {
        await page.click('[data-testid="mobile-save-item"]');

        // Should show upload progress
        await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
        await expect(page.locator('[data-testid="upload-progress"]')).toContainText('Uploading photos...');

        // Wait for upload completion
        await expect(page.locator('[data-testid="upload-complete"]')).toBeVisible();
        await expect(page.locator('[data-testid="photos-synced"]')).toBeVisible();
      });

      await test.step('Web user sees optimized photos', async () => {
        const webPage = await context.newPage();
        await webPage.goto('/inventory');

        await webPage.click('[data-testid="inventory-item"]').first();

        // Should show all photos with proper optimization
        await expect(webPage.locator('[data-testid="item-photo"]')).toHaveCount(3);

        // Check photo gallery functionality
        await webPage.click('[data-testid="photo-gallery-next"]');
        await webPage.click('[data-testid="photo-gallery-next"]');
        await webPage.click('[data-testid="photo-gallery-previous"]');

        // Verify photos load quickly (optimized)
        await expect(webPage.locator('[data-testid="photo-loading"]')).not.toBeVisible();

        await webPage.close();
      });
    });
  });

  test.describe('Authentication State Sync', () => {
    test('Login state syncs across mobile and web', async ({ browser }) => {
      const webContext = await browser.newContext();
      const mobileContext = await browser.newContext({ ...devices['iPhone 12'] });

      const webPage = await webContext.newPage();
      const mobilePage = await mobileContext.newPage();

      await test.step('User logs in on web', async () => {
        await webPage.goto('/auth/login');
        await webPage.fill('[data-testid="email"]', 'auth-sync-test@netpost.app');
        await webPage.fill('[data-testid="password"]', 'TestPassword123!');
        await webPage.click('[data-testid="login-button"]');
        await webPage.waitForURL('/dashboard');
      });

      await test.step('Mobile automatically recognizes authenticated session', async () => {
        // Navigate to mobile app - should auto-login
        await mobilePage.goto('/dashboard');

        // Should not be redirected to login
        await expect(mobilePage).toHaveURL('/dashboard');
        await expect(mobilePage.locator('[data-testid="mobile-user-menu"]')).toBeVisible();
      });

      await test.step('Logout on mobile affects web session', async () => {
        await mobilePage.click('[data-testid="mobile-user-menu"]');
        await mobilePage.click('[data-testid="mobile-logout"]');
        await expect(mobilePage).toHaveURL('/auth/login');

        // Web should also be logged out
        await webPage.reload();
        await expect(webPage).toHaveURL('/auth/login');
      });

      await webContext.close();
      await mobileContext.close();
    });
  });

  test.describe('Conflict Resolution', () => {
    test('System handles simultaneous edits gracefully', async ({ browser }) => {
      const webContext = await browser.newContext();
      const mobileContext = await browser.newContext({ ...devices['iPhone 12'] });

      const webPage = await webContext.newPage();
      const mobilePage = await mobileContext.newPage();

      await test.step('Setup same item on both devices', async () => {
        // Both users login and navigate to same item
        await webPage.goto('/inventory');
        await mobilePage.goto('/inventory');

        await webPage.click('[data-testid="inventory-item"]').first();
        await mobilePage.click('[data-testid="mobile-inventory-item"]').first();
      });

      await test.step('Simultaneous edits create conflict', async () => {
        // Start editing on both devices simultaneously
        await webPage.click('[data-testid="edit-item"]');
        await mobilePage.click('[data-testid="mobile-edit-item"]');

        // Make different changes
        await webPage.fill('[data-testid="item-description"]', 'Web edit description');
        await mobilePage.fill('[data-testid="mobile-item-description"]', 'Mobile edit description');

        // Save on mobile first
        await mobilePage.click('[data-testid="mobile-save-changes"]');
        await expect(mobilePage.locator('[data-testid="mobile-changes-saved"]')).toBeVisible();

        // Try to save on web (should detect conflict)
        await webPage.click('[data-testid="save-changes"]');
        await expect(webPage.locator('[data-testid="conflict-resolution-dialog"]')).toBeVisible();
      });

      await test.step('User resolves conflict', async () => {
        // Show conflict resolution options
        await expect(webPage.locator('[data-testid="conflict-web-version"]')).toContainText('Web edit description');
        await expect(webPage.locator('[data-testid="conflict-mobile-version"]')).toContainText('Mobile edit description');

        // User chooses to merge changes
        await webPage.click('[data-testid="merge-changes"]');
        await webPage.fill('[data-testid="merged-description"]', 'Combined: Web edit description + Mobile edit description');
        await webPage.click('[data-testid="save-merged-changes"]');

        await expect(webPage.locator('[data-testid="conflict-resolved"]')).toBeVisible();
      });

      await test.step('Resolution syncs to mobile', async () => {
        // Mobile should receive the resolved changes
        await mobilePage.reload();
        await mobilePage.click('[data-testid="mobile-inventory-item"]').first();
        await expect(mobilePage.locator('[data-testid="mobile-item-description"]')).toContainText('Combined: Web edit description + Mobile edit description');
      });

      await webContext.close();
      await mobileContext.close();
    });
  });
});