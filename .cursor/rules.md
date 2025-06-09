# Cursor AI Rules for Wanderlist (Supabase + MCP)

## Project Overview
Wanderlist is a Next.js 15 application for saving and organizing places from Google Maps, built with Supabase as the backend and enhanced with MCP (Model Context Protocol) for AI-assisted development.

## Tech Stack
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Maps**: Google Places API
- **AI Integration**: Cursor MCP for database operations
- **Deployment**: Vercel

## Supabase + MCP Development Patterns

### Database Operations
- **Always use MCP tools** for database schema changes, queries, and analysis
- **Prefer database functions** over client-side logic for complex operations
- **Use RLS policies** instead of client-side permission checks
- **Leverage JSONB columns** for flexible data structures (user preferences, metadata)

### MCP Usage Guidelines
```typescript
// Use MCP tools for:
// - Schema analysis: mcp_supabase_list_tables, mcp_supabase_list_extensions
// - Data operations: mcp_supabase_execute_sql, mcp_supabase_apply_migration
// - Function management: Deploy and test database functions
// - Performance analysis: Query optimization and index analysis
```

### Database Function Patterns
```sql
-- Create optimized functions for complex operations
CREATE OR REPLACE FUNCTION get_enhanced_user_lists(user_uuid UUID)
RETURNS TABLE(...) AS $$
BEGIN
  -- Use CTEs for complex queries
  -- Include proper error handling
  -- Return structured data
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### TypeScript Integration
```typescript
// Always use generated Supabase types
import { Database } from '@/types/supabase'
type List = Database['public']['Tables']['lists']['Row']

// Use proper error handling
import { DatabaseError } from '@/lib/supabase/database'

try {
  const result = await supabase.rpc('function_name', params)
  if (result.error) throw new DatabaseError(result.error.message)
} catch (error) {
  // Handle specific error types
}
```

## Code Organization Patterns

### File Structure
```
src/
├── lib/supabase/
│   ├── client.ts          # Supabase client configuration
│   ├── database.ts        # Database operations with error handling
│   └── typeUtils.ts       # Type conversion utilities
├── types/
│   └── supabase.ts        # Auto-generated Supabase types
└── hooks/
    └── useAuth.ts         # Supabase auth integration
```

### Component Patterns
```typescript
// Use Supabase real-time subscriptions
const { data, error } = await supabase
  .from('lists')
  .select('*')
  .eq('user_id', user.id)
  .order('updated_at', { ascending: false })

// Handle loading and error states
if (error) {
  console.error('Database error:', error)
  // Show user-friendly error message
}
```

## Security Best Practices

### Row Level Security (RLS)
- **Always enable RLS** on all tables
- **Create specific policies** for each operation (SELECT, INSERT, UPDATE, DELETE)
- **Use helper functions** for complex permission logic
- **Test policies thoroughly** with different user scenarios

### Data Validation
```sql
-- Use check constraints for data validation
ALTER TABLE lists ADD CONSTRAINT valid_difficulty 
CHECK (difficulty_level >= 1 AND difficulty_level <= 5);

-- Use JSONB schema validation
ALTER TABLE users ADD CONSTRAINT valid_preferences 
CHECK (jsonb_typeof(preferences) = 'object');
```

### Authentication Patterns
```typescript
// Use Supabase auth helpers
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

// Server-side auth check
const supabase = createServerComponentClient({ cookies })
const { data: { session } } = await supabase.auth.getSession()
```

## Performance Optimization

### Database Optimization
- **Use indexes strategically** for common query patterns
- **Implement materialized views** for complex aggregations
- **Use database functions** to reduce network round trips
- **Leverage JSONB indexes** for flexible queries

### Query Patterns
```typescript
// Prefer single queries with joins over multiple queries
const { data } = await supabase
  .from('lists')
  .select(`
    *,
    users!inner(display_name, photo_url),
    list_places(count)
  `)
  .eq('is_public', true)
```

## Error Handling

### Database Errors
```typescript
class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Handle specific Supabase error codes
if (error.code === 'PGRST116') {
  // Record not found
} else if (error.code === '23505') {
  // Unique constraint violation
}
```

### User-Friendly Messages
- **Map database errors** to user-friendly messages
- **Provide actionable feedback** when possible
- **Log detailed errors** for debugging while showing simple messages to users

## Testing Patterns

### Database Testing
```typescript
// Use MCP tools for testing database functions
// Test RLS policies with different user contexts
// Validate data constraints and triggers
```

### Integration Testing
```typescript
// Test complete user flows
// Verify real-time subscriptions
// Test error handling scenarios
```

## MCP Integration Best Practices

### Development Workflow
1. **Use MCP for schema analysis** before making changes
2. **Test database functions** using MCP execute_sql
3. **Generate TypeScript types** after schema changes
4. **Validate performance** with MCP query analysis

### Common MCP Commands
```typescript
// Schema exploration
mcp_supabase_list_tables()
mcp_supabase_list_extensions()

// Function testing
mcp_supabase_execute_sql("SELECT * FROM function_name(params)")

// Migration application
mcp_supabase_apply_migration(name, query)
```

## Deployment Considerations

### Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# MCP Configuration
SUPABASE_PERSONAL_ACCESS_TOKEN=
```

### Production Checklist
- [ ] RLS policies enabled and tested
- [ ] Database functions deployed
- [ ] Indexes optimized for production queries
- [ ] Error monitoring configured
- [ ] Performance monitoring enabled

## Common Patterns to Avoid

### Anti-Patterns
- ❌ Client-side permission checks instead of RLS
- ❌ Multiple database calls when one would suffice
- ❌ Storing sensitive data in client-accessible tables
- ❌ Not handling database errors gracefully
- ❌ Using raw SQL strings instead of parameterized queries

### Migration from Firebase
- ❌ Don't port Firebase security rules directly - use RLS instead
- ❌ Don't use Firestore document patterns - leverage relational design
- ❌ Don't ignore PostgreSQL features like JSONB, arrays, and functions

## Documentation Standards

### Code Comments
```typescript
/**
 * Enhanced function using Supabase RPC for optimal performance
 * @param userId - User UUID from Supabase auth
 * @returns Promise<EnhancedUserList[]> - Lists with counts and metadata
 */
export async function getEnhancedUserLists(userId: string) {
  // Implementation with proper error handling
}
```

### Database Documentation
```sql
-- Function: get_enhanced_user_lists
-- Purpose: Retrieve user lists with place counts and engagement metrics
-- Performance: Uses indexes on user_id, is_public, updated_at
-- Security: RLS enforced, function is SECURITY DEFINER
```

## AI Behavior for Documentation

### Documentation-First Development
- **Before suggesting solutions**: Reference `/docs/troubleshooting/` for known issues and proven solutions
- **When asked about implementation decisions**: First check `/docs/lessons-learned/` and `/docs/architecture/` for context and rationale
- **When planning new features**: Consult `/docs/roadmap/` for alignment with planned enhancements and avoid duplicating planned work
- **For setup or configuration issues**: Direct users to appropriate guides in `/docs/setup/`
- **When encountering migration-related questions**: Reference `/docs/migration/` for historical context and lessons learned

### Documentation Maintenance
- **Always suggest updating relevant documentation** when making significant changes to:
  - Database schema or functions → Update `/docs/architecture/`
  - New troubleshooting solutions → Add to `/docs/troubleshooting/`
  - Performance optimizations → Document in `/docs/lessons-learned/`
  - New setup requirements → Update `/docs/setup/`
  - Feature implementations → Consider adding to `/docs/roadmap/` if extensible

### Knowledge Preservation
- **Capture institutional knowledge**: When solving complex problems, suggest documenting the solution and reasoning
- **Reference existing patterns**: Before creating new patterns, check if similar solutions exist in the documentation
- **Maintain consistency**: Ensure new implementations follow established patterns documented in `/docs/architecture/`
- **Update cross-references**: When adding new documentation, update the main `/docs/README.md` index

This file should be updated as the project evolves and new patterns emerge.