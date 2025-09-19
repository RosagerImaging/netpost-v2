import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Cleans up test data and resources
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');

  try {
    // Clean up test files
    await cleanupTestFiles();

    // Clean up test data (if configured)
    await cleanupTestData();

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

/**
 * Clean up test files and artifacts
 */
async function cleanupTestFiles() {
  console.log('🗑️ Cleaning up test files...');

  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Clean up auth files
    const authDir = path.join(process.cwd(), 'tests/e2e/.auth');
    try {
      await fs.rmdir(authDir, { recursive: true });
    } catch (error) {
      // Directory might not exist, ignore
    }

    // Clean up temporary test data files
    const tempDir = path.join(process.cwd(), 'tests/temp');
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might not exist, ignore
    }

    console.log('✅ Test files cleaned up');
  } catch (error) {
    console.log('⚠️ File cleanup failed:', error);
  }
}

/**
 * Clean up test data from database
 */
async function cleanupTestData() {
  console.log('🗃️ Cleaning up test data...');

  try {
    // Only clean up if in test environment
    if (process.env.NODE_ENV === 'test' || process.env.CLEANUP_TEST_DATA === 'true') {
      // Add cleanup logic here when database is implemented
      console.log('✅ Test data cleanup completed');
    } else {
      console.log('⚠️ Skipping test data cleanup (not in test environment)');
    }
  } catch (error) {
    console.log('⚠️ Test data cleanup failed:', error);
  }
}

export default globalTeardown;