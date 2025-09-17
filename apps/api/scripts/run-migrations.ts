#!/usr/bin/env tsx

/**
 * Migration Runner Script
 *
 * Command-line interface for running database migrations
 * Usage: tsx run-migrations.ts [command] [options]
 */

import { migrationManager, runMigrations, showStatus, validateMigrations } from '../database/migrate';

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'run':
    case 'migrate':
      console.log('🚀 Running database migrations...');
      await runMigrations();
      break;

    case 'status':
      console.log('📊 Checking migration status...');
      await showStatus();
      break;

    case 'validate':
      console.log('✅ Validating migrations...');
      await validateMigrations();
      break;

    case 'init':
      console.log('🏗️  Initializing migration system...');
      await migrationManager.initialize();
      console.log('✅ Migration system initialized successfully');
      break;

    default:
      console.log(`
🗄️  NetPost V2 Database Migration Tool

Usage: tsx run-migrations.ts [command]

Commands:
  run, migrate    Run all pending migrations
  status          Show migration status
  validate        Validate migration files
  init            Initialize migration system
  help            Show this help message

Examples:
  tsx run-migrations.ts run
  tsx run-migrations.ts status
  tsx run-migrations.ts validate
      `);
      break;
  }
}

// Run the CLI
main().catch(error => {
  console.error('❌ Migration command failed:', error);
  process.exit(1);
});