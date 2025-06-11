# 🗄️ Database Troubleshooting

This guide covers database connection issues, Row Level Security problems, query performance issues, and migration failures.

## 🚨 Quick Fixes for Critical Database Issues

### **🔥 Database Connection Failed**
```bash
# 1. Check Supabase project status
# Go to Supabase Dashboard → Check if project is paused

# 2. Test connection with direct query
# Go to Supabase SQL Editor → Run: SELECT 1;

# 3. Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Check RLS policies aren't blocking access
```

### **🔥 RLS Infinite Recursion Error**
```sql
-- Quick fix: Check for circular policy dependencies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('lists', 'list_collaborators', 'users');

-- If you see circular references, use security definer functions
```

### **🔥 Queries Extremely Slow**
```sql
-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('lists', 'places', 'list_places')
ORDER BY tablename, attname;

-- Check for table bloat
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
ORDER BY n_tup_ins DESC;
```

---

## 🔍 Common Database Issues

### **1. Row Level Security (RLS) Issues**

#### **Error: Infinite Recursion Detected**
```
Database error: {code: '42P17', message: 'infinite recursion detected in policy for relation "lists"'}
```

#### **Root Cause**
Circular dependencies between RLS policies on related tables.

#### **Solution**
Use security definer functions to break circular dependencies:

```sql
-- Create security definer function
CREATE OR REPLACE FUNCTION public.is_list_collaborator(list_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM list_collaborators
    WHERE list_collaborators.list_id = $1
      AND list_collaborators.user_id = $2
  );
$$;

-- Update policy to use function
CREATE POLICY lists_basic_select ON lists
FOR SELECT
TO public
USING (
  auth.uid() = user_id 
  OR is_public = true 
  OR public.is_list_collaborator(id, auth.uid())
);
```

#### **Prevention**
- Avoid circular references between table policies
- Use security definer functions for complex permission checks
- Test policies thoroughly before deployment

---

### **2. Database Connection Issues**

#### **Symptoms**
- Connection timeouts
- "Database is not available" errors
- Intermittent connection failures

#### **Debugging Steps**
```bash
# 1. Check Supabase project status
# Dashboard → Settings → General → Project status

# 2. Test direct connection
psql "postgresql://postgres:[password]@db.tbabdwdhostkadpwwbhy.supabase.co:5432/postgres"

# 3. Check connection pooling
# Dashboard → Settings → Database → Connection pooling
```

#### **Common Causes & Solutions**

##### **Project Paused**
```bash
# Solution: Restore project in Supabase dashboard
# Dashboard → Settings → General → Restore project
```

##### **Connection Pool Exhausted**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection limits
SELECT setting FROM pg_settings WHERE name = 'max_connections';
```

##### **Network/Firewall Issues**
```bash
# Test network connectivity
ping db.tbabdwdhostkadpwwbhy.supabase.co
telnet db.tbabdwdhostkadpwwbhy.supabase.co 5432
```

---

### **3. Query Performance Issues**

#### **Symptoms**
- Slow page loads
- Database timeouts
- High CPU usage in Supabase dashboard

#### **Performance Analysis**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

#### **Optimization Solutions**

##### **Missing Indexes**
```sql
-- Add strategic indexes for common queries
CREATE INDEX idx_lists_user_public_updated 
ON lists(user_id, is_public, updated_at DESC);

CREATE INDEX idx_places_location_gin 
ON places USING GIN(location);

CREATE INDEX idx_list_places_composite 
ON list_places(list_id, place_id, created_at);
```

##### **Inefficient Queries**
```sql
-- Use EXPLAIN ANALYZE to identify bottlenecks
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT * FROM get_user_lists_with_counts('user-id');

-- Optimize with database functions
CREATE OR REPLACE FUNCTION get_user_lists_optimized(p_user_id UUID)
RETURNS TABLE(
  list_data JSONB,
  place_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(l.*) as list_data,
    COALESCE(pc.count, 0)::INTEGER as place_count
  FROM lists l
  LEFT JOIN (
    SELECT list_id, COUNT(*) as count
    FROM list_places
    GROUP BY list_id
  ) pc ON l.id = pc.list_id
  WHERE l.user_id = p_user_id
  ORDER BY l.updated_at DESC;
END;
$$ LANGUAGE plpgsql;
```

---

### **4. Migration and Schema Issues**

#### **Migration Failures**
```bash
# Check migration status
npm run db:status

# View migration history
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;

# Check for failed migrations
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
WHERE executed_at IS NULL;
```

#### **Schema Inconsistencies**
```sql
-- Check table structure
\d+ lists
\d+ users
\d+ places

-- Verify constraints
SELECT conname, contype, confrelid::regclass, conkey, confkey
FROM pg_constraint
WHERE conrelid = 'lists'::regclass;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'lists';
```

#### **Data Type Issues**
```sql
-- Check for data type mismatches
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lists'
ORDER BY ordinal_position;

-- Fix common type issues
ALTER TABLE lists ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE users ALTER COLUMN metadata TYPE jsonb USING metadata::jsonb;
```

---

## 🛠️ Advanced Database Debugging

### **Using MCP for Database Analysis**
```bash
# If MCP is available, use these commands:
"Show me all tables in the database"
"Check query performance for getUserLists function"
"Analyze slow queries from the last hour"
"Check table bloat across all tables"
"Show index usage statistics"
```

### **Performance Monitoring Queries**
```sql
-- Monitor real-time activity
SELECT pid, usename, application_name, state, query_start, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start;

-- Check lock conflicts
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Check database size and growth
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
       pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **Database Maintenance**
```sql
-- Vacuum and analyze tables
VACUUM ANALYZE lists;
VACUUM ANALYZE places;
VACUUM ANALYZE list_places;

-- Reindex if needed
REINDEX TABLE lists;

-- Update table statistics
ANALYZE lists;
```

---

## 📋 Database Health Checklist

### **Connection Health**
- [ ] Supabase project is active (not paused)
- [ ] Environment variables are correct
- [ ] Connection pooling is configured
- [ ] No network connectivity issues

### **Performance Health**
- [ ] Query response times < 100ms for simple queries
- [ ] No queries taking > 5 seconds
- [ ] Index hit ratio > 95%
- [ ] No table bloat > 20%

### **Security Health**
- [ ] RLS is enabled on all tables
- [ ] No circular policy dependencies
- [ ] Policies allow appropriate access
- [ ] No security definer functions with vulnerabilities

### **Schema Health**
- [ ] All migrations applied successfully
- [ ] No orphaned data or constraints
- [ ] Data types are appropriate
- [ ] Indexes exist for common query patterns

---

## 🔗 Related Documentation

### **Database Documentation**
- **[Database Schema](../database/README.md)** - Complete schema overview
- **[Database Functions](../database/functions/)** - All database functions
- **[Performance Guide](../database/performance.md)** - Database optimization
- **[Maintenance Procedures](../database/maintenance.md)** - Database maintenance

### **Specific Issues**
- **[RLS Troubleshooting](./SUPABASE_RLS_TROUBLESHOOTING.md)** - Detailed RLS issue resolution
- **[Performance Monitoring](../performance/monitoring.md)** - Performance tools and dashboards

### **Setup and Configuration**
- **[Supabase Configuration](../setup/supabase-configuration.md)** - Initial database setup
- **[Security Model](../security/README.md)** - RLS policies and security

---

## 🆘 When to Escalate

### **Level 1: Quick Fixes (5-15 minutes)**
1. Check Supabase project status
2. Verify environment variables
3. Test with direct SQL query
4. Clear application caches

### **Level 2: Performance Analysis (15-60 minutes)**
1. Analyze slow queries with EXPLAIN
2. Check index usage and table statistics
3. Review RLS policies for conflicts
4. Test with minimal data set

### **Level 3: Advanced Debugging (1+ hours)**
1. Use MCP tools for deep analysis
2. Check for schema inconsistencies
3. Analyze migration history
4. Consider database maintenance

### **Level 4: External Support**
1. **Supabase Support** - For platform-specific issues
2. **PostgreSQL Community** - For complex query optimization
3. **Database Consultant** - For major performance issues

---

*🗄️ Database issues can be complex and impact the entire application. Always start with connection and basic health checks before diving into performance optimization.*

*Last Updated: June 10, 2025* 