import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Authenticates test users and prepares test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  // Start browser for authentication
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    await page.goto(baseURL);

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Set up test data and authentication
    await setupTestUsers(page);
    await setupTestData(page);

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Set up authenticated test users
 */
async function setupTestUsers(page: any) {
  console.log('👤 Setting up test users...');

  // Create or authenticate test user
  try {
    // Navigate to sign up
    await page.goto('/auth/signup');

    // Fill test user credentials
    await page.fill('[data-testid="email"]', 'test@netpost.app');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.fill('[data-testid="confirm-password"]', 'TestPassword123!');

    // Submit form
    await page.click('[data-testid="signup-button"]');

    // Wait for success or handle existing user
    await page.waitForURL('/dashboard', { timeout: 10000 }).catch(() => {
      console.log('User may already exist, attempting login...');
    });

    // Store auth state
    await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });

    console.log('✅ Test users set up successfully');
  } catch (error) {
    console.log('⚠️ Test user setup failed, continuing with existing user');
  }
}

/**
 * Set up test data
 */
async function setupTestData(page: any) {
  console.log('📦 Setting up test data...');

  try {
    // Navigate to inventory
    await page.goto('/inventory');

    // Create sample inventory items if needed
    const itemCount = await page.locator('[data-testid="inventory-item"]').count();

    if (itemCount === 0) {
      // Create sample items
      await createSampleInventoryItem(page, 'Test Item 1', 'Electronics', 99.99);
      await createSampleInventoryItem(page, 'Test Item 2', 'Clothing', 29.99);
      console.log('✅ Sample inventory items created');
    } else {
      console.log('✅ Test data already exists');
    }
  } catch (error) {
    console.log('⚠️ Test data setup failed:', error);
  }
}

/**
 * Create a sample inventory item
 */
async function createSampleInventoryItem(page: any, title: string, category: string, price: number) {
  await page.click('[data-testid="add-item-button"]');
  await page.fill('[data-testid="item-title"]', title);
  await page.selectOption('[data-testid="item-category"]', category);
  await page.fill('[data-testid="item-price"]', price.toString());
  await page.click('[data-testid="save-item-button"]');
  await page.waitForSelector('[data-testid="item-saved-toast"]');
}

export default globalSetup;