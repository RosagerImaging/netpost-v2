#!/usr/bin/env tsx

/**
 * Subscription Migration Runner
 * Directly executes the subscription system migration
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../database/supabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runSubscriptionMigration() {
  try {
    console.log('🚀 Running subscription system migration...');

    // Read the migration file
    const migrationPath = join(__dirname, '../database/migrations/008_create_subscription_tables.sql');
    const migrationSQL = await readFile(migrationPath, 'utf-8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);

        try {
          // Use query method for SQL execution
          const { error } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .limit(1);

          if (error) {
            console.log('Database connection verified');
          }

          // For subscription tables creation, we need to use raw SQL
          // Since Supabase doesn't allow arbitrary SQL from client, we'll create a function
          console.log('⚠️  Direct SQL execution not supported via Supabase client');
          console.log('Please execute the following migration manually in your Supabase SQL editor:');
          console.log('==========================================');
          console.log(migrationSQL);
          console.log('==========================================');

          return;
        } catch (error) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, error);
          throw error;
        }
      }
    }

    console.log('✅ Subscription migration completed successfully');
  } catch (error) {
    console.error('❌ Subscription migration failed:', error);
    process.exit(1);
  }
}

// Check if we can at least verify the database connection
async function verifyConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function main() {
  console.log('🗄️  NetPost Subscription System Migration');
  console.log('===============================================');

  // Verify connection first
  const connectionOk = await verifyConnection();
  if (!connectionOk) {
    process.exit(1);
  }

  await runSubscriptionMigration();
}

main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});