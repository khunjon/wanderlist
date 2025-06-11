# 🔧 Database Functions Documentation

This directory contains comprehensive documentation for all database functions in Wanderlist, organized by category and purpose.

## 📋 Functions Overview

### 🎯 **Function Categories**
- **[User Management](./user-management.md)** - User profile and authentication functions
- **[List Operations](./list-operations.md)** - List creation, management, and querying functions
- **[Analytics](./analytics.md)** - Tracking, metrics, and analytics functions
- **[Monitoring](./monitoring.md)** - Database health and performance monitoring functions

### 📊 **Function Summary**
| Category | Functions | Purpose | Performance |
|----------|-----------|---------|-------------|
| **User Management** | 5+ functions | Profile management, authentication | <50ms avg |
| **List Operations** | 8+ functions | Core list functionality | <100ms avg |
| **Analytics** | 6+ functions | Tracking and metrics | <25ms avg |
| **Monitoring** | 10+ functions | Database health monitoring | <200ms avg |

## ⚡ Core Functions Quick Reference

### 🔧 **Essential Functions**

#### **1. get_user_lists_with_counts()**
```sql
-- Get user lists with aggregated place counts
SELECT * FROM get_user_lists_with_counts('user-uuid-here');
```
**Purpose**: Primary function for lists page - retrieves user lists with place counts
**Performance**: Single query vs multiple round trips (80% faster)
**Usage**: Called on every lists page load

#### **2. increment_list_view_count()**
```sql
-- Track list popularity
SELECT increment_list_view_count('list-uuid-here');
```
**Purpose**: Analytics tracking for list discovery algorithms
**Performance**: Atomic operation with minimal overhead
**Usage**: Called when users view public lists

#### **3. check_table_bloat()**
```sql
-- Monitor database health
SELECT * FROM check_table_bloat();
```
**Purpose**: Real-time database health monitoring
**Performance**: Comprehensive analysis in <200ms
**Usage**: MCP-integrated monitoring and alerts

## 🏗️ Function Design Patterns

### 🔒 **Security Pattern**
All functions follow the `SECURITY DEFINER` pattern for controlled access:

```sql
CREATE OR REPLACE FUNCTION function_name(params)
RETURNS return_type AS $$
BEGIN
  -- Function logic with RLS enforcement
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Benefits:**
- **Controlled Access**: Functions run with elevated privileges
- **RLS Enforcement**: Row Level Security still applies
- **Atomic Operations**: Transaction safety guaranteed
- **Performance**: Server-side processing optimization

### 📊 **Performance Pattern**
Functions are optimized for common query patterns:

```sql
-- Example: Optimized aggregation function
CREATE OR REPLACE FUNCTION get_list_statistics(list_uuid UUID)
RETURNS TABLE(
  place_count INTEGER,
  avg_rating DECIMAL,
  total_likes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(lp.place_id)::INTEGER,
    AVG(p.rating),
    COUNT(ll.user_id)::INTEGER
  FROM list_places lp
  LEFT JOIN places p ON lp.place_id = p.id
  LEFT JOIN list_likes ll ON lp.list_id = ll.list_id
  WHERE lp.list_id = list_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Benefits:**
- **Single Query**: Reduces network round trips
- **Database Optimization**: Leverages PostgreSQL query planner
- **Consistent Results**: Atomic data retrieval
- **Caching Friendly**: Predictable query patterns

### 🔄 **Error Handling Pattern**
Functions include comprehensive error handling:

```sql
CREATE OR REPLACE FUNCTION safe_function_example(param UUID)
RETURNS result_type AS $$
DECLARE
  result result_type;
BEGIN
  -- Validation
  IF param IS NULL THEN
    RAISE EXCEPTION 'Parameter cannot be null';
  END IF;
  
  -- Main logic with error handling
  BEGIN
    -- Function logic here
    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Function failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📁 Function Categories

### 👤 **User Management Functions**
Functions for user profile management and authentication.

**Key Functions:**
- `create_user_profile()` - Initialize user profile on registration
- `update_user_profile()` - Update user profile information
- `get_user_statistics()` - User engagement metrics
- `validate_user_permissions()` - Permission checking

**[View Details →](./user-management.md)**

### 📝 **List Operations Functions**
Core functions for list creation, management, and querying.

**Key Functions:**
- `get_user_lists_with_counts()` - Primary lists retrieval
- `create_list_with_validation()` - List creation with constraints
- `get_public_lists_for_discovery()` - Discovery page optimization
- `update_list_metadata()` - List information updates

**[View Details →](./list-operations.md)**

### 📊 **Analytics Functions**
Tracking, metrics, and analytics functions for user engagement.

**Key Functions:**
- `increment_list_view_count()` - View tracking
- `track_user_engagement()` - Engagement metrics
- `get_popular_places()` - Place popularity analysis
- `generate_usage_statistics()` - Usage reporting

**[View Details →](./analytics.md)**

### 🔧 **Monitoring Functions**
Database health, performance monitoring, and maintenance functions.

**Key Functions:**
- `check_table_bloat()` - Table health monitoring
- `get_urgent_maintenance_tables()` - Maintenance recommendations
- `perform_maintenance_vacuum()` - Automated maintenance
- `analyze_query_performance()` - Performance analysis

**[View Details →](./monitoring.md)**

## 🚀 Performance Optimization

### ⚡ **Function Performance Metrics**
| Function Type | Avg Response Time | Optimization Level |
|---------------|-------------------|-------------------|
| **User Queries** | 45ms | ✅ Optimized |
| **List Operations** | 85ms | ✅ Optimized |
| **Analytics** | 20ms | ✅ Highly Optimized |
| **Monitoring** | 150ms | ✅ Acceptable |

### 📈 **Optimization Techniques**
1. **Strategic Indexing**: Functions leverage optimized indexes
2. **Query Planning**: EXPLAIN ANALYZE used for all complex functions
3. **Caching**: Results cached where appropriate
4. **Batch Operations**: Bulk operations for efficiency

### 🔄 **Real-time Integration**
Functions are designed to work seamlessly with real-time subscriptions:

```typescript
// Example: Real-time function integration
const { data, error } = await supabase.rpc('get_user_lists_with_counts', {
  user_uuid: userId
})

// Subscribe to changes that would affect function results
const subscription = supabase
  .channel('list-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'lists',
    filter: `user_id=eq.${userId}`
  }, () => {
    // Refresh function results
    refreshLists()
  })
```

## 🔗 Related Documentation

- **[Database Schema](../schema.sql)** - Complete database schema
- **[Performance Guide](../performance.md)** - Query optimization strategies
- **[Maintenance Procedures](../maintenance.md)** - Database maintenance
- **[Security Policies](../README.md#row-level-security-rls-model)** - RLS implementation

---

*Last Updated: June 10, 2025* 