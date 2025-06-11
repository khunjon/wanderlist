# 🚀 Database Performance Optimization

This document provides comprehensive database performance analysis, optimization strategies, and monitoring for Wanderlist's PostgreSQL database.

## 📊 Performance Overview

### 🎯 **Current Performance Status**
- **Query Performance**: Excellent (0.093-0.146ms execution times)
- **Index Usage**: Good with some optimization opportunities
- **Table Bloat**: Critical issue requiring immediate attention
- **Autovacuum**: Optimized for development workload
- **Monitoring**: Comprehensive MCP-based monitoring implemented

### 📈 **Key Performance Metrics**
| Metric | Current | Target | Status |
|--------|---------|--------|---------|
| **Average Query Time** | 0.12ms | <100ms | ✅ Excellent |
| **Planning Time** | 1.6ms | <5ms | ✅ Good |
| **Index Hit Ratio** | >95% | >95% | ✅ Excellent |
| **Table Bloat** | 85% | <20% | 🔴 Critical |
| **Connection Pool** | Managed | Optimized | ✅ Good |

## 🗄️ Database Performance Analysis

### 📊 **Table Performance Metrics**

#### **Table Sizes and Health**
| Table | Size | Live Rows | Dead Rows | Dead Row % | Status |
|-------|------|-----------|-----------|------------|---------|
| **lists** | 416 kB | 4 | 24 | 85.71% | 🔴 CRITICAL |
| **users** | 336 kB | 1 | 40 | 83.33% | 🔴 CRITICAL |
| **list_places** | 248 kB | 18 | 7 | 28% | 🟠 HIGH |
| **places** | 256 kB | 17 | 1 | 5.56% | ✅ OK |

#### **Critical Issues Identified**
1. **High Dead Row Ratios** → Frequent updates without proper VACUUM operations
2. **Table Bloat** → Slower queries and increased storage usage
3. **Over-Indexing** → 75+ indexes across 4 tables may slow INSERT/UPDATE operations

### ⚡ **Query Performance Analysis**

#### **Core Query Performance**
```sql
-- getUserLists Query Performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT * FROM lists 
WHERE user_id = $1 
ORDER BY updated_at DESC;

-- Results:
-- Execution Time: 0.093ms (excellent)
-- Planning Time: 1.275ms (acceptable)
-- Index Usage: ✅ Uses idx_lists_user_public_updated efficiently
```

```sql
-- getPublicLists Query Performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT l.*, u.display_name, u.photo_url 
FROM lists l 
INNER JOIN users u ON l.user_id = u.id 
WHERE l.is_public = true 
ORDER BY l.view_count DESC 
LIMIT 50;

-- Results:
-- Execution Time: 0.146ms (excellent)
-- Planning Time: 2.006ms (concerning)
-- Join Strategy: Nested Loop (efficient for small datasets)
-- Bottleneck: Sequential scan on users table
```

#### **Slow Query Analysis**
Top performance issues from `pg_stat_statements`:

1. **Place Insertion Queries** (13.3ms mean execution time)
   - **Impact**: High - affects add place workflow
   - **Cause**: Complex JSON processing and constraint validation
   - **Solution**: Optimize JSON handling and batch insertions

2. **List Creation Queries** (12.9ms mean execution time)
   - **Impact**: Medium - affects new list creation
   - **Cause**: Multiple constraint checks and trigger execution
   - **Solution**: Streamline validation and reduce trigger complexity

## 🔧 Index Optimization

### 📈 **Current Index Analysis**

#### **Effective Indexes**
```sql
-- Well-performing indexes
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_public_discovery_popularity ON lists(is_public, view_count DESC);
CREATE INDEX idx_list_places_list_id ON list_places(list_id);
CREATE INDEX idx_places_google_id ON places(google_place_id);
```

#### **Missing Critical Indexes**
```sql
-- Recommended new indexes
CREATE INDEX idx_lists_public_view_count ON lists(is_public, view_count DESC) 
WHERE is_public = true;

CREATE INDEX idx_users_display_name ON users(display_name) 
WHERE display_name IS NOT NULL;

CREATE INDEX idx_list_places_composite ON list_places(list_id, created_at);
```

#### **Over-Indexing Issues**
- **Lists Table**: 36 indexes (recommended: 8-12)
- **Redundant Indexes**: Multiple overlapping indexes for public list discovery
- **Impact**: Slower INSERT/UPDATE operations, increased storage

### 🎯 **Index Optimization Strategy**
1. **Remove Redundant Indexes** → Identify and drop overlapping indexes
2. **Add Missing Indexes** → Create indexes for common query patterns
3. **Partial Indexes** → Use WHERE clauses for filtered indexes
4. **Composite Indexes** → Optimize multi-column queries

## 🧹 Database Maintenance

### 🔄 **Autovacuum Optimization**

#### **Current Autovacuum Settings**
```sql
-- Optimized for development workload
ALTER TABLE lists SET (
  autovacuum_vacuum_scale_factor = 0.1,  -- 10% threshold (was 20%)
  autovacuum_vacuum_threshold = 10       -- Minimum 10 rows
);

ALTER TABLE users SET (
  autovacuum_vacuum_scale_factor = 0.1,  -- 10% threshold
  autovacuum_vacuum_threshold = 10
);

ALTER TABLE list_places SET (
  autovacuum_vacuum_scale_factor = 0.15, -- 15% threshold
  autovacuum_vacuum_threshold = 25
);
```

#### **Maintenance Commands**
```sql
-- Immediate maintenance required
VACUUM ANALYZE users;
VACUUM ANALYZE lists;
VACUUM ANALYZE list_places;

-- Regular maintenance schedule
-- Daily: VACUUM ANALYZE on high-update tables
-- Weekly: REINDEX on heavily used indexes
-- Monthly: Full database VACUUM FULL (during maintenance window)
```

### 📊 **Database Monitoring Functions**

#### **MCP-Integrated Monitoring**
```sql
-- Check table bloat status
SELECT * FROM check_table_bloat();

-- Get urgent maintenance recommendations
SELECT * FROM get_urgent_maintenance_tables();

-- Analyze autovacuum settings
SELECT * FROM get_autovacuum_settings();

-- Get maintenance commands
SELECT * FROM get_maintenance_commands();

-- Perform automated maintenance
SELECT * FROM perform_maintenance_vacuum();
```

#### **Monitoring Function Results**
```sql
-- Example output from get_urgent_maintenance_tables()
table_name | dead_row_percentage | recommended_action | priority
-----------|--------------------|--------------------|----------
lists      | 85.71%             | VACUUM ANALYZE     | CRITICAL
users      | 83.33%             | VACUUM ANALYZE     | CRITICAL
list_places| 28.00%             | VACUUM ANALYZE     | HIGH
```

## 🚀 Performance Optimization Strategies

### 📊 **Database Function Optimization**

#### **High-Performance Function Pattern**
```sql
-- Optimized function for complex queries
CREATE OR REPLACE FUNCTION get_enhanced_user_lists(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  is_public BOOLEAN,
  place_count INTEGER,
  like_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.description,
    l.is_public,
    l.place_count,
    l.like_count,
    l.created_at
  FROM lists l
  WHERE l.user_id = user_uuid
  ORDER BY l.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Benefits:**
- **Reduced Network Round Trips** → Single function call vs multiple queries
- **Server-Side Processing** → Leverage database optimization
- **Atomic Operations** → Transaction safety and consistency
- **Centralized Logic** → Business rules in database layer

### 🔄 **Real-time Performance**

#### **Optimized Real-time Subscriptions**
```sql
-- Enable real-time with minimal overhead
ALTER TABLE lists REPLICA IDENTITY FULL;
ALTER TABLE list_places REPLICA IDENTITY FULL;
ALTER TABLE list_likes REPLICA IDENTITY FULL;
```

#### **Efficient Subscription Patterns**
```typescript
// Optimized real-time subscription with filtering
const subscription = supabase
  .channel('user-lists')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'lists',
    filter: `user_id=eq.${userId}` // Server-side filtering
  }, (payload) => {
    // Minimal client-side processing
    updateLocalState(payload)
  })
  .subscribe()
```

### 📈 **Materialized Views Strategy**

#### **Current Readiness Assessment**
- **Database Size**: 13.10 MB (threshold: 100 MB)
- **Total Rows**: 259 (threshold: 10,000)
- **Status**: NOT_READY (infrastructure prepared)

#### **Planned Materialized Views**
```sql
-- Phase 1: List Statistics (1K+ users)
CREATE MATERIALIZED VIEW mv_list_statistics AS
SELECT 
  l.id,
  l.name,
  l.user_id,
  l.is_public,
  COUNT(lp.place_id) as place_count,
  COUNT(ll.user_id) as like_count,
  AVG(p.rating) as avg_rating
FROM lists l
LEFT JOIN list_places lp ON l.id = lp.list_id
LEFT JOIN list_likes ll ON l.id = ll.list_id
LEFT JOIN places p ON lp.place_id = p.id
GROUP BY l.id, l.name, l.user_id, l.is_public;

-- Phase 2: Popular Places (5K+ users)
CREATE MATERIALIZED VIEW mv_popular_places AS
SELECT 
  p.id,
  p.name,
  p.google_place_id,
  COUNT(lp.list_id) as list_count,
  AVG(p.rating) as avg_rating,
  p.place_types
FROM places p
JOIN list_places lp ON p.id = lp.place_id
JOIN lists l ON lp.list_id = l.id
WHERE l.is_public = true
GROUP BY p.id, p.name, p.google_place_id, p.place_types
ORDER BY list_count DESC;
```

## 🔧 Performance Monitoring

### 📊 **MCP-Based Performance Monitoring**

#### **Real-time Performance Analysis**
```bash
# MCP commands for performance monitoring
mcp_supabase_execute_sql(query="
  SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
  FROM pg_stat_statements 
  WHERE query LIKE '%lists%' 
  ORDER BY mean_exec_time DESC 
  LIMIT 10
")

# Database bloat monitoring
mcp_supabase_execute_sql(query="SELECT * FROM check_table_bloat()")

# Index usage analysis
mcp_supabase_execute_sql(query="
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC
")
```

#### **Performance Metrics Dashboard**
```sql
-- Comprehensive performance overview
SELECT 
  'Query Performance' as metric_type,
  ROUND(AVG(mean_exec_time), 2) as avg_time_ms,
  COUNT(*) as query_count
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'

UNION ALL

SELECT 
  'Table Health' as metric_type,
  ROUND(AVG(dead_row_percentage), 2) as avg_bloat_pct,
  COUNT(*) as table_count
FROM check_table_bloat()

UNION ALL

SELECT 
  'Index Efficiency' as metric_type,
  ROUND(AVG(idx_scan), 2) as avg_scans,
  COUNT(*) as index_count
FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

## 🎯 Performance Optimization Roadmap

### 📅 **Immediate Actions (Week 1)**
1. **Execute Critical Maintenance**
   ```sql
   VACUUM ANALYZE users;
   VACUUM ANALYZE lists;
   VACUUM ANALYZE list_places;
   ```

2. **Add Missing Indexes**
   ```sql
   CREATE INDEX CONCURRENTLY idx_lists_public_view_count 
   ON lists(is_public, view_count DESC) WHERE is_public = true;
   
   CREATE INDEX CONCURRENTLY idx_users_display_name 
   ON users(display_name) WHERE display_name IS NOT NULL;
   ```

3. **Remove Redundant Indexes**
   - Audit and remove overlapping indexes
   - Monitor query performance after removal

### 📅 **Short-term Optimizations (Month 1)**
1. **Query Optimization**
   - Optimize place insertion queries
   - Streamline list creation workflow
   - Implement query result caching

2. **Function Performance**
   - Create optimized database functions for common operations
   - Implement batch processing for bulk operations

3. **Monitoring Enhancement**
   - Set up automated performance alerts
   - Implement query performance tracking

### 📅 **Long-term Strategy (Months 2-6)**
1. **Materialized Views Implementation**
   - Phase 1: List statistics (at 1K users)
   - Phase 2: Popular places (at 5K users)
   - Phase 3: User analytics (at 10K users)

2. **Advanced Optimization**
   - Connection pooling optimization
   - Read replica implementation
   - Partitioning for large tables

3. **Scalability Preparation**
   - Database sharding strategy
   - Caching layer implementation
   - Performance testing at scale

## 🔗 Related Documentation

- **[Database Schema](./schema.sql)** - Complete database schema
- **[Maintenance Guide](./maintenance.md)** - Database maintenance procedures
- **[Index Monitoring](./index-monitoring.md)** - Index performance monitoring
- **[Materialized Views](./materialized-views.md)** - Materialized views strategy
- **[Functions Documentation](./functions/)** - Individual function documentation

---

*Last Updated: June 10, 2025* 