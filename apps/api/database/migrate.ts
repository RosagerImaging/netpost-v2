/**
 * Database Migration System
 *
 * Manages database schema versions and migrations for NetPost V2
 * Provides rollback capabilities and migration tracking
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { supabaseAdmin } from './supabase';

// Migration record interface
export interface MigrationRecord {
  id: number;
  name: string;
  filename: string;
  checksum: string;
  executed_at: string;
  execution_time_ms: number;
  success: boolean;
  error_message?: string;
}

// Migration file interface
export interface MigrationFile {
  filename: string;
  name: string;
  version: number;
  sql: string;
  checksum: string;
}

// Migration result interface
export interface MigrationResult {
  success: boolean;
  migrationsExecuted: number;
  errors: string[];
  executionTimeMs: number;
  details: Array<{
    filename: string;
    success: boolean;
    executionTimeMs: number;
    error?: string;
  }>;
}

/**
 * Database Migration Manager
 */
export class MigrationManager {
  private migrationsPath: string;

  constructor(migrationsPath: string = join(__dirname, 'migrations')) {
    this.migrationsPath = migrationsPath;
  }

  /**
   * Initialize the migrations system
   * Creates the migrations tracking table if it doesn't exist
   */
  async initialize(): Promise<void> {
    const createMigrationsTableSQL = `
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        filename VARCHAR(255) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW(),
        execution_time_ms INTEGER NOT NULL,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        rollback_sql TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON public.schema_migrations(name);
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON public.schema_migrations(executed_at);
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_success ON public.schema_migrations(success);
    `;

    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: createMigrationsTableSQL,
      });

      if (error) {
        throw new Error(`Failed to initialize migrations table: ${error.message}`);
      }

      console.log('✅ Migration system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migration system:', error);
      throw error;
    }
  }

  /**
   * Get all migration files from the migrations directory
   */
  async getMigrationFiles(): Promise<MigrationFile[]> {
    try {
      const files = await readdir(this.migrationsPath);
      const migrationFiles: MigrationFile[] = [];

      for (const filename of files) {
        if (!filename.endsWith('.sql')) continue;

        const filePath = join(this.migrationsPath, filename);
        const sql = await readFile(filePath, 'utf-8');
        const checksum = await this.calculateChecksum(sql);

        // Extract version number from filename (e.g., 001_create_users.sql -> 1)
        const versionMatch = filename.match(/^(\d+)_/);
        const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;

        // Extract migration name
        const nameMatch = filename.match(/^\d+_(.+)\.sql$/);
        const name = nameMatch ? nameMatch[1].replace(/_/g, ' ') : filename;

        migrationFiles.push({
          filename,
          name,
          version,
          sql,
          checksum,
        });
      }

      // Sort by version number
      return migrationFiles.sort((a, b) => a.version - b.version);
    } catch (error) {
      console.error('❌ Failed to read migration files:', error);
      throw error;
    }
  }

  /**
   * Get executed migrations from the database
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('schema_migrations')
        .select('*')
        .eq('success', true)
        .order('executed_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to get executed migrations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error);
      throw error;
    }
  }

  /**
   * Get pending migrations that need to be executed
   */
  async getPendingMigrations(): Promise<MigrationFile[]> {
    const allMigrations = await this.getMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = new Set(executedMigrations.map(m => m.name));

    return allMigrations.filter(migration => !executedNames.has(migration.name));
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration: MigrationFile): Promise<{
    success: boolean;
    executionTimeMs: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      console.log(`🔄 Executing migration: ${migration.filename}`);

      // Execute the migration SQL
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: migration.sql,
      });

      const executionTimeMs = Date.now() - startTime;

      if (error) {
        throw new Error(error.message);
      }

      // Record successful migration
      await this.recordMigration(migration, executionTimeMs, true);

      console.log(`✅ Migration completed: ${migration.filename} (${executionTimeMs}ms)`);

      return {
        success: true,
        executionTimeMs,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ Migration failed: ${migration.filename}`, errorMessage);

      // Record failed migration
      await this.recordMigration(migration, executionTimeMs, false, errorMessage);

      return {
        success: false,
        executionTimeMs,
        error: errorMessage,
      };
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<MigrationResult> {
    const startTime = Date.now();
    let migrationsExecuted = 0;
    const errors: string[] = [];
    const details: MigrationResult['details'] = [];

    try {
      await this.initialize();

      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return {
          success: true,
          migrationsExecuted: 0,
          errors: [],
          executionTimeMs: Date.now() - startTime,
          details: [],
        };
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        const result = await this.executeMigration(migration);

        details.push({
          filename: migration.filename,
          success: result.success,
          executionTimeMs: result.executionTimeMs,
          error: result.error,
        });

        if (result.success) {
          migrationsExecuted++;
        } else {
          errors.push(`${migration.filename}: ${result.error}`);
          // Stop on first error to prevent cascade failures
          break;
        }
      }

      const totalExecutionTime = Date.now() - startTime;
      const success = errors.length === 0;

      console.log(
        success
          ? `✅ All migrations completed successfully (${migrationsExecuted} executed in ${totalExecutionTime}ms)`
          : `❌ Migration failed with ${errors.length} errors`
      );

      return {
        success,
        migrationsExecuted,
        errors,
        executionTimeMs: totalExecutionTime,
        details,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Migration process failed:', errorMessage);

      return {
        success: false,
        migrationsExecuted,
        errors: [errorMessage],
        executionTimeMs: Date.now() - startTime,
        details,
      };
    }
  }

  /**
   * Get migration status and information
   */
  async getStatus(): Promise<{
    initialized: boolean;
    totalMigrations: number;
    executedMigrations: number;
    pendingMigrations: number;
    lastMigration?: MigrationRecord;
    failedMigrations: MigrationRecord[];
  }> {
    try {
      // Check if migrations table exists
      const { data: tables } = await supabaseAdmin.rpc('get_table_info', {
        table_name: 'schema_migrations',
      });

      const initialized = tables && tables.length > 0;

      if (!initialized) {
        return {
          initialized: false,
          totalMigrations: 0,
          executedMigrations: 0,
          pendingMigrations: 0,
          failedMigrations: [],
        };
      }

      const allMigrations = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      const pendingMigrations = await this.getPendingMigrations();

      // Get failed migrations
      const { data: failedData } = await supabaseAdmin
        .from('schema_migrations')
        .select('*')
        .eq('success', false)
        .order('executed_at', { ascending: false });

      const failedMigrations = failedData || [];

      // Get last successful migration
      const lastMigration = executedMigrations[executedMigrations.length - 1];

      return {
        initialized: true,
        totalMigrations: allMigrations.length,
        executedMigrations: executedMigrations.length,
        pendingMigrations: pendingMigrations.length,
        lastMigration,
        failedMigrations,
      };
    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * Validate migration files for consistency
   */
  async validateMigrations(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const allMigrations = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      // Check for version conflicts
      const versions = allMigrations.map(m => m.version);
      const duplicateVersions = versions.filter(
        (version, index) => versions.indexOf(version) !== index
      );

      if (duplicateVersions.length > 0) {
        issues.push(`Duplicate migration versions found: ${duplicateVersions.join(', ')}`);
      }

      // Check for checksum mismatches
      for (const migration of allMigrations) {
        const executed = executedMigrations.find(m => m.name === migration.name);
        if (executed && executed.checksum !== migration.checksum) {
          issues.push(
            `Checksum mismatch for ${migration.filename}: executed checksum ${executed.checksum} does not match file checksum ${migration.checksum}`
          );
        }
      }

      // Check for missing migration files
      for (const executed of executedMigrations) {
        const file = allMigrations.find(m => m.name === executed.name);
        if (!file) {
          issues.push(`Migration file missing for executed migration: ${executed.name}`);
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        issues: [`Validation failed: ${errorMessage}`],
      };
    }
  }

  /**
   * Record a migration execution in the database
   */
  private async recordMigration(
    migration: MigrationFile,
    executionTimeMs: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from('schema_migrations').insert({
        name: migration.name,
        filename: migration.filename,
        checksum: migration.checksum,
        execution_time_ms: executionTimeMs,
        success,
        error_message: errorMessage,
      });

      if (error) {
        console.error('Failed to record migration:', error);
      }
    } catch (error) {
      console.error('Failed to record migration:', error);
    }
  }

  /**
   * Calculate SHA-256 checksum of migration content
   */
  private async calculateChecksum(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * CLI functions for migration management
 */

// Create migration manager instance
const migrationManager = new MigrationManager();

/**
 * Run migrations from command line
 */
export async function runMigrations(): Promise<void> {
  try {
    const result = await migrationManager.runMigrations();

    if (result.success) {
      process.exit(0);
    } else {
      console.error('Migrations failed:', result.errors);
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

/**
 * Show migration status
 */
export async function showStatus(): Promise<void> {
  try {
    const status = await migrationManager.getStatus();

    console.log('📊 Migration Status:');
    console.log(`   Initialized: ${status.initialized}`);
    console.log(`   Total migrations: ${status.totalMigrations}`);
    console.log(`   Executed: ${status.executedMigrations}`);
    console.log(`   Pending: ${status.pendingMigrations}`);

    if (status.lastMigration) {
      console.log(`   Last migration: ${status.lastMigration.name} (${status.lastMigration.executed_at})`);
    }

    if (status.failedMigrations.length > 0) {
      console.log(`   Failed migrations: ${status.failedMigrations.length}`);
      status.failedMigrations.forEach(migration => {
        console.log(`     - ${migration.name}: ${migration.error_message}`);
      });
    }
  } catch (error) {
    console.error('Failed to get migration status:', error);
    process.exit(1);
  }
}

/**
 * Validate migrations
 */
export async function validateMigrations(): Promise<void> {
  try {
    const validation = await migrationManager.validateMigrations();

    if (validation.valid) {
      console.log('✅ All migrations are valid');
    } else {
      console.error('❌ Migration validation failed:');
      validation.issues.forEach(issue => {
        console.error(`   - ${issue}`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration validation failed:', error);
    process.exit(1);
  }
}

/**
 * Export the migration manager for use in other modules
 */
export { migrationManager };
export default MigrationManager;