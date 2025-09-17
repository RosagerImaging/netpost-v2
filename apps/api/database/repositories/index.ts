/**
 * Repository Index
 *
 * Central export point for all repository classes
 * Provides factory functions and repository management
 */

export { BaseRepository } from './base-repository';
export { UserRepository } from './user-repository';
export { InventoryRepository } from './inventory-repository';

// Repository factory for dependency injection
export class RepositoryFactory {
  private static userRepository: UserRepository | null = null;
  private static inventoryRepository: InventoryRepository | null = null;

  /**
   * Get User Repository instance (singleton)
   */
  static getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository();
    }
    return this.userRepository;
  }

  /**
   * Get Inventory Repository instance (singleton)
   */
  static getInventoryRepository(): InventoryRepository {
    if (!this.inventoryRepository) {
      this.inventoryRepository = new InventoryRepository();
    }
    return this.inventoryRepository;
  }

  /**
   * Health check for all repositories
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    repositories: Record<string, { healthy: boolean; latency: number; error?: string }>;
  }> {
    const repositories = {
      user: this.getUserRepository(),
      inventory: this.getInventoryRepository(),
    };

    const results: Record<string, { healthy: boolean; latency: number; error?: string }> = {};
    let allHealthy = true;

    for (const [name, repo] of Object.entries(repositories)) {
      try {
        results[name] = await repo.healthCheck();
        if (!results[name].healthy) {
          allHealthy = false;
        }
      } catch (error) {
        results[name] = {
          healthy: false,
          latency: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        allHealthy = false;
      }
    }

    return {
      healthy: allHealthy,
      repositories: results,
    };
  }

  /**
   * Reset all repository instances (useful for testing)
   */
  static reset(): void {
    this.userRepository = null;
    this.inventoryRepository = null;
  }
}

// Export repository instances for direct use
export const userRepository = RepositoryFactory.getUserRepository();
export const inventoryRepository = RepositoryFactory.getInventoryRepository();

// Export common types used by repositories
export type {
  SingleResult,
  QueryResult,
  ValidationResult,
  PaginationOptions,
  SortOptions,
  FilterOptions,
} from '@/packages/shared-types/database';