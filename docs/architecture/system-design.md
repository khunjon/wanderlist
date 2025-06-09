# System Architecture & Design Decisions

## Overview
This document outlines the high-level system architecture for Wanderlist, capturing key design decisions, trade-offs, and the rationale behind our technology choices.

## Architecture Overview

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │    │   (Supabase)    │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React UI      │    │ • PostgreSQL    │    │ • Google Places │
│ • TypeScript    │    │ • Auth System   │    │ • Google Maps   │
│ • Tailwind CSS  │    │ • Real-time     │    │ • Vercel        │
│ • State Mgmt    │    │ • Storage       │    │ • CDN           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Development   │
                    │   Tools (MCP)   │
                    ├─────────────────┤
                    │ • Cursor AI     │
                    │ • Database Ops  │
                    │ • Type Gen      │
                    │ • Performance   │
                    └─────────────────┘
```

## Technology Stack Decisions

### Frontend Architecture

#### Next.js 15 Choice
**Decision**: Use Next.js 15 with App Router
**Rationale**:
- **Server-Side Rendering**: Better SEO for public list discovery
- **API Routes**: Simplified backend integration
- **File-based Routing**: Intuitive project structure
- **TypeScript Support**: Built-in type safety
- **Performance**: Automatic optimization and code splitting

#### State Management Strategy
**Decision**: React hooks + Supabase real-time subscriptions
**Rationale**:
- **Simplicity**: Avoid complex state management libraries
- **Real-time**: Leverage Supabase's built-in real-time capabilities
- **Local State**: Use React hooks for component-level state
- **Server State**: Supabase handles data synchronization

#### Styling Approach
**Decision**: Tailwind CSS with component-based design
**Rationale**:
- **Utility-First**: Rapid development and consistent design
- **Mobile-First**: Built-in responsive design patterns
- **Performance**: Purged CSS for optimal bundle size
- **Maintainability**: Consistent design system

### Backend Architecture

#### Database Choice: PostgreSQL via Supabase
**Decision**: PostgreSQL over NoSQL (Firestore)
**Rationale**:
- **Relational Data**: Our data has clear relationships (users → lists → places)
- **Complex Queries**: Need for joins, aggregations, and full-text search
- **ACID Compliance**: Data consistency for critical operations
- **Scalability**: PostgreSQL scales well for our use case
- **Developer Experience**: SQL familiarity and powerful querying

#### Authentication Strategy
**Decision**: Supabase Auth with Row Level Security
**Rationale**:
- **Security**: Database-level security enforcement
- **Flexibility**: Multiple authentication providers
- **Integration**: Seamless with PostgreSQL user management
- **Scalability**: Handles session management automatically

#### API Design
**Decision**: Supabase auto-generated APIs + custom database functions
**Rationale**:
- **Rapid Development**: Auto-generated REST and GraphQL APIs
- **Type Safety**: Generated TypeScript types
- **Performance**: Custom functions for complex operations
- **Flexibility**: Can extend with custom API routes when needed

### Data Architecture

#### Schema Design Philosophy
**Decision**: Normalized relational design with strategic denormalization
**Rationale**:
- **Data Integrity**: Normalized design prevents inconsistencies
- **Performance**: Strategic denormalization (e.g., place counts) for common queries
- **Flexibility**: Easy to add new relationships and constraints
- **Maintainability**: Clear data model that's easy to understand

#### Security Model
**Decision**: Row Level Security (RLS) policies
**Rationale**:
- **Database-Level Security**: Cannot be bypassed by application bugs
- **Granular Control**: Fine-grained permissions per operation
- **Performance**: Policies can use indexes for efficient filtering
- **Auditability**: Clear security rules that can be tested and verified

### Real-time Features

#### Real-time Strategy
**Decision**: Supabase real-time subscriptions
**Rationale**:
- **Built-in**: No additional infrastructure needed
- **SQL-based**: Can filter subscriptions with SQL
- **Scalable**: Handles connection management automatically
- **Secure**: Integrates with RLS for secure real-time updates

## Key Design Patterns

### Database Function Pattern
```sql
-- Pattern: Complex operations as database functions
CREATE OR REPLACE FUNCTION get_enhanced_user_lists(user_uuid UUID)
RETURNS TABLE(...) AS $$
BEGIN
  -- Complex logic with multiple joins and aggregations
  -- Better performance than multiple client-side queries
  -- Atomic operations with proper error handling
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Benefits**:
- Reduced network round trips
- Better performance through database optimization
- Atomic operations with transaction safety
- Centralized business logic

### Error Handling Pattern
```typescript
// Pattern: Specific error handling with user-friendly messages
class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Map database errors to user-friendly messages
function handleDatabaseError(error: any): never {
  if (error.code === 'PGRST116') {
    throw new DatabaseError('Item not found', 'NOT_FOUND')
  }
  // ... handle other specific cases
}
```

### Data Transformation Pattern
```typescript
// Pattern: Clear separation between database and application types
export function transformListFromDB(dbList: DBList): AppList {
  return {
    id: dbList.id,
    name: dbList.name,
    isPublic: dbList.is_public,  // snake_case → camelCase
    createdAt: new Date(dbList.created_at),  // string → Date
    // ... other transformations
  }
}
```

## Performance Considerations

### Database Performance
- **Strategic Indexing**: Indexes on common query patterns
- **Query Optimization**: Use EXPLAIN ANALYZE for all complex queries
- **Connection Pooling**: Supabase handles connection management
- **Caching Strategy**: Database-level caching for frequently accessed data

### Frontend Performance
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component for place photos
- **Lazy Loading**: Components and data loaded on demand
- **Bundle Optimization**: Tree shaking and minification

### Real-time Performance
- **Selective Subscriptions**: Only subscribe to necessary data changes
- **Efficient Updates**: Use database functions to minimize data transfer
- **Connection Management**: Proper cleanup of subscriptions

## Security Architecture

### Authentication Flow
```
User Login → Supabase Auth → JWT Token → RLS Policies → Database Access
```

### Data Security Layers
1. **Network Security**: HTTPS/TLS encryption
2. **Authentication**: Supabase Auth with secure session management
3. **Authorization**: Row Level Security policies
4. **Data Validation**: Database constraints and application validation
5. **API Security**: Rate limiting and input sanitization

### Privacy Considerations
- **Data Minimization**: Only collect necessary user data
- **User Control**: Users control visibility of their lists and profiles
- **Secure Storage**: Profile photos in Supabase Storage with proper access controls
- **Audit Trail**: Database logs for security monitoring

## Scalability Strategy

### Horizontal Scaling
- **Stateless Frontend**: Next.js applications can be easily replicated
- **Database Scaling**: PostgreSQL read replicas for read-heavy workloads
- **CDN Integration**: Static assets served from global CDN
- **Microservices Ready**: Architecture allows for future service extraction

### Vertical Scaling
- **Database Optimization**: Efficient queries and proper indexing
- **Caching Layers**: Redis for session and query caching
- **Resource Monitoring**: Track database and application performance

## Development Experience

### MCP Integration Benefits
- **Real-time Database Access**: Test queries and functions immediately
- **Type Generation**: Automatic TypeScript type generation
- **Performance Analysis**: Query optimization during development
- **Schema Exploration**: Understand database structure quickly

### Development Workflow
```
1. Design → 2. Database Schema → 3. MCP Testing → 4. Application Code → 5. Integration Testing
```

### Testing Strategy
- **Database Testing**: Use MCP tools for function and query testing
- **Integration Testing**: Test complete user flows
- **Type Safety**: TypeScript catches integration errors at compile time
- **Performance Testing**: Monitor query performance during development

## Deployment Architecture

### Production Environment
```
Internet → Vercel Edge → Next.js App → Supabase → PostgreSQL
                    ↓
                Google CDN → Static Assets
                    ↓
              Google Places API
```

### Environment Separation
- **Development**: Local development with Supabase project
- **Staging**: Separate Supabase project for testing
- **Production**: Production Supabase project with monitoring

### Monitoring & Observability
- **Application Monitoring**: Vercel analytics and error tracking
- **Database Monitoring**: Supabase dashboard metrics
- **Performance Monitoring**: Core Web Vitals and user experience metrics
- **Error Tracking**: Comprehensive error logging and alerting

## Future Architecture Considerations

### Potential Enhancements
- **GraphQL Layer**: For more flexible client queries
- **Microservices**: Extract specific domains (search, recommendations)
- **Event-Driven Architecture**: For complex business workflows
- **Machine Learning**: Recommendation engine and content analysis

### Scalability Milestones
- **10K Users**: Current architecture sufficient
- **100K Users**: Add read replicas and caching layers
- **1M Users**: Consider microservices and advanced caching
- **10M Users**: Multi-region deployment and data partitioning

## Technology Trade-offs

### Supabase vs. Custom Backend
**Chosen**: Supabase
**Trade-offs**:
- ✅ **Faster Development**: Auto-generated APIs and auth
- ✅ **Built-in Features**: Real-time, storage, auth out of the box
- ✅ **PostgreSQL Power**: Full SQL capabilities
- ❌ **Vendor Lock-in**: Dependent on Supabase ecosystem
- ❌ **Customization Limits**: Some advanced features require workarounds

### Next.js vs. SPA Framework
**Chosen**: Next.js
**Trade-offs**:
- ✅ **SEO Benefits**: Server-side rendering for public content
- ✅ **Performance**: Automatic optimization and code splitting
- ✅ **Full-stack**: API routes for server-side logic
- ❌ **Complexity**: More complex than pure client-side apps
- ❌ **Hosting Requirements**: Needs server-side rendering capability

### PostgreSQL vs. NoSQL
**Chosen**: PostgreSQL
**Trade-offs**:
- ✅ **Relational Data**: Perfect fit for our interconnected data
- ✅ **Query Power**: Complex joins and aggregations
- ✅ **ACID Compliance**: Strong consistency guarantees
- ❌ **Schema Rigidity**: Changes require migrations
- ❌ **Scaling Complexity**: Vertical scaling limitations

## Conclusion

The current architecture provides a solid foundation for Wanderlist's requirements:

- **Developer Productivity**: MCP integration and Supabase features enable rapid development
- **Performance**: Database functions and strategic indexing provide excellent performance
- **Security**: RLS policies and Supabase Auth provide robust security
- **Scalability**: Architecture can handle significant growth with incremental improvements
- **Maintainability**: Clear separation of concerns and type safety reduce maintenance burden

The architecture balances rapid development needs with long-term scalability and maintainability, providing a strong foundation for future growth and feature development.

---

*This architecture document should be reviewed and updated as the system evolves and new requirements emerge.* 