# NetPost V2 Database Implementation

This directory contains the complete database schema, migrations, and data access layer for NetPost V2. The implementation follows a repository pattern with TypeScript integration and comprehensive testing capabilities.

## 📁 Directory Structure

```
database/
├── migrations/               # SQL migration files
│   ├── 001_create_user_profiles.sql
│   ├── 002_create_inventory_items.sql
│   ├── 003_create_listings.sql
│   ├── 004_create_marketplace_connections.sql
│   └── 005_add_relationships_and_constraints.sql
├── repositories/            # Repository pattern implementation
│   ├── base-repository.ts   # Base repository class
│   ├── user-repository.ts   # User profile operations
│   ├── inventory-repository.ts # Inventory management
│   └── index.ts            # Repository factory
├── supabase.ts             # Database connection setup
├── migrate.ts              # Migration management system
└── README.md               # This file
```

## 🗄️ Database Schema

### Core Tables

#### 1. user_profiles
Extends Supabase Auth with reseller-specific profile data:
- Business information and subscription management
- Onboarding tracking and preferences
- Performance metrics and seller ratings
- Location and contact information

#### 2. inventory_items
Comprehensive inventory management:
- Item details, photos, and descriptions
- Sourcing information and cost tracking
- AI-generated metadata and pricing
- Status tracking and performance metrics

#### 3. listings
Cross-platform listing management:
- Marketplace-specific configurations
- Pricing and shipping information
- Performance tracking and analytics
- Sales data and profit calculations

#### 4. marketplace_connections
Secure API credential storage:
- Encrypted OAuth tokens and API keys
- Connection health monitoring
- Rate limiting and error tracking
- Webhook configuration

### Relationships

```
user_profiles (1) → (many) inventory_items
user_profiles (1) → (many) listings
user_profiles (1) → (many) marketplace_connections
inventory_items (1) → (many) listings
marketplace_connections (1) → (many) listings [optional]
```

## 🚀 Getting Started

### 1. Environment Setup

Ensure your `.env.local` file contains the required Supabase configuration:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 2. Run Migrations

```bash
# Initialize the migration system
tsx apps/api/scripts/run-migrations.ts init

# Run all pending migrations
tsx apps/api/scripts/run-migrations.ts run

# Check migration status
tsx apps/api/scripts/run-migrations.ts status

# Validate migration files
tsx apps/api/scripts/run-migrations.ts validate
```

### 3. Using Repositories

```typescript
import { userRepository, inventoryRepository } from './database/repositories';

// Create a new user profile
const user = await userRepository.create({
  business_name: 'My Reselling Business',
  subscription_tier: 'pro',
  preferred_currency: 'USD',
});

// Add inventory item
const item = await inventoryRepository.create({
  title: 'Vintage Designer Jacket',
  condition: 'excellent',
  purchase_price: 25.00,
  target_price: 85.00,
}, user.data.id);

// Search inventory
const searchResults = await inventoryRepository.search(
  'vintage jacket',
  user.data.id,
  { includeDescription: true, includeTags: true }
);
```

## 🔐 Security Features

### Row Level Security (RLS)
All tables implement RLS policies ensuring users can only access their own data:
- User profiles: Users see only their own profile
- Inventory items: Users see only their own inventory
- Listings: Users see only their own listings
- Marketplace connections: Users see only their own connections

### Credential Encryption
Marketplace API credentials are encrypted using PostgreSQL's `pgcrypto` extension:
- OAuth tokens stored as encrypted BYTEA
- Automatic encryption/decryption functions
- Secure key management (environment-based)

### Data Validation
Comprehensive validation at multiple levels:
- Database constraints and check conditions
- Repository-level validation
- TypeScript type safety
- Business logic validation

## 📊 Performance Optimizations

### Indexes
Strategic indexing for common query patterns:
- User lookups across all tables
- Full-text search on titles and descriptions
- Status and category filtering
- Date range queries
- Composite indexes for complex queries

### Views
Optimized views for common operations:
- `user_profiles_public`: Safe public profile data
- `inventory_items_enhanced`: Items with computed fields
- `active_listings`: Current listings with performance metrics
- `marketplace_connections_safe`: Connections without credentials

### Triggers
Automated data maintenance:
- Timestamp updates on record changes
- Status change validation and cascading
- Performance metric calculations
- User statistic updates

## 🔄 Migration System

The migration system provides:
- **Versioned Migrations**: Sequential, numbered migration files
- **Checksum Validation**: Ensures migration integrity
- **Rollback Support**: Track changes for potential rollbacks
- **Health Monitoring**: Migration status and validation
- **CLI Interface**: Easy command-line management

### Migration Files
Each migration follows a naming convention:
- `001_create_user_profiles.sql`
- `002_create_inventory_items.sql`
- etc.

### Running Migrations
```bash
# See all available commands
tsx apps/api/scripts/run-migrations.ts help

# Run pending migrations
tsx apps/api/scripts/run-migrations.ts run

# Check what needs to be migrated
tsx apps/api/scripts/run-migrations.ts status
```

## 🏗️ Repository Pattern

### Base Repository
All repositories extend `BaseRepository` which provides:
- Standard CRUD operations
- Pagination and filtering
- Bulk operations
- Soft delete functionality
- Health checking
- Real-time subscriptions

### Specific Repositories

#### UserRepository
- Profile management and onboarding
- Subscription handling
- Performance metrics
- Public profile access
- Business user discovery

#### InventoryRepository
- Item management with enhanced search
- Status tracking and analytics
- Bulk operations
- Attention-needed item detection
- Performance analytics

## 📝 TypeScript Integration

### Generated Types
All database types are defined in `packages/shared-types/database/`:
- Complete type safety from database to frontend
- Enum definitions matching database enums
- Input/output type variations
- Validation helpers and business logic functions

### Type Usage
```typescript
import type {
  UserProfileRecord,
  InventoryItemRecord,
  CreateInventoryItemInput,
  InventoryItemStatus,
} from '@/packages/shared-types/database';

// Type-safe repository operations
const item: InventoryItemRecord = await inventoryRepository.findById(itemId);
const status: InventoryItemStatus = 'available';
```

## 🧪 Testing

### Repository Testing
```typescript
import { userRepository } from './repositories';

describe('UserRepository', () => {
  test('should create user profile', async () => {
    const profile = await userRepository.create({
      business_name: 'Test Business',
      subscription_tier: 'free',
    });

    expect(profile.found).toBe(true);
    expect(profile.data?.business_name).toBe('Test Business');
  });
});
```

### Health Checks
```typescript
import { RepositoryFactory } from './repositories';

// Check all repository health
const health = await RepositoryFactory.healthCheck();
console.log('Database healthy:', health.healthy);
```

## 🔧 Utilities and Functions

### Database Functions
- `validate_inventory_item_data()`: Validates item completeness
- `validate_listing_data()`: Validates listing requirements
- `analyze_database_performance()`: Performance monitoring
- `cleanup_old_deleted_records()`: Maintenance tasks

### Helper Functions
- Profile completion calculation
- ROI and profit margin calculations
- Status transition validation
- Search optimization
- Performance metric computation

## 🚨 Error Handling

### Repository Errors
All repositories provide consistent error handling:
- Type-safe error classes
- Descriptive error messages
- Proper error codes
- Logging and monitoring

### Database Errors
- Connection failure handling
- Query timeout management
- Constraint violation messages
- Transaction rollback support

## 📈 Monitoring and Analytics

### Performance Metrics
- Query execution times
- Index usage statistics
- Table size monitoring
- Connection pool status

### Business Analytics
- User growth and churn
- Inventory turnover rates
- Listing performance
- Revenue tracking

## 🔮 Future Enhancements

### Planned Features
- Database replication support
- Advanced caching strategies
- Real-time synchronization
- Advanced analytics queries
- Automated backup system

### Scalability Considerations
- Connection pooling optimization
- Query optimization analysis
- Index strategy refinement
- Partitioning for large datasets

## 🆘 Troubleshooting

### Common Issues

1. **Migration Failures**
   ```bash
   # Check migration status
   tsx apps/api/scripts/run-migrations.ts status

   # Validate migrations
   tsx apps/api/scripts/run-migrations.ts validate
   ```

2. **Connection Issues**
   ```typescript
   // Test database connectivity
   import { checkDatabaseHealth } from './supabase';
   const health = await checkDatabaseHealth();
   ```

3. **RLS Policy Issues**
   - Ensure user is authenticated
   - Check user_id parameters
   - Verify policy definitions

4. **Performance Issues**
   ```sql
   -- Analyze query performance
   SELECT * FROM analyze_database_performance();
   ```

### Getting Help
- Check the migration logs for detailed error messages
- Use the validation functions to check data integrity
- Monitor the health check endpoints
- Review the Supabase dashboard for query insights

---

This database implementation provides a robust, scalable foundation for NetPost V2's multi-platform reselling operations. The combination of strong typing, security policies, and performance optimizations ensures reliable data management as the platform grows.