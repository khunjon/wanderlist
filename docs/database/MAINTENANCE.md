# Database Maintenance Guide

## Overview

This guide provides comprehensive database maintenance procedures for the Placemarks application, based on MCP analysis and current database health assessment.

## Current Database Health Status

### Table Bloat Analysis (Last Updated: 2025-06-10)

Based on MCP analysis, the following tables show significant dead row accumulation:

| Table | Live Rows | Dead Rows | Dead Row % | Status | Action Required |
|-------|-----------|-----------|------------|--------|-----------------|
| `lists` | 4 | 24 | 85.71% | ⚠️ HIGH BLOAT | VACUUM URGENT |
| `users` | 1 | 5 | 83.33% | ⚠️ HIGH BLOAT | VACUUM URGENT |
| `list_places` | 18 | 7 | 28.00% | ⚠️ MODERATE BLOAT | VACUUM RECOMMENDED |
| `places` | 17 | 1 | 5.56% | ✅ HEALTHY | Monitor |

### Critical Findings

1. **Lists table**: 85.71% dead rows - This is critical and requires immediate attention
2. **Users table**: 83.33% dead rows - High bloat affecting authentication queries
3. **List_places table**: 28% dead rows - Moderate bloat affecting list operations
4. **Autovacuum**: Currently enabled but not triggering frequently enough for development workload

## VACUUM Operations

### Manual VACUUM Commands

#### Immediate Actions Required

```sql
-- URGENT: Clean up lists table (85.71% dead rows)
VACUUM ANALYZE lists;

-- URGENT: Clean up users table (83.33% dead rows) 
VACUUM ANALYZE users;

-- RECOMMENDED: Clean up list_places table (28% dead rows)
VACUUM ANALYZE list_places;

-- OPTIONAL: Full database maintenance
VACUUM ANALYZE;
```

#### VACUUM with Detailed Output

```sql
-- For monitoring and logging
VACUUM (VERBOSE, ANALYZE) lists;
VACUUM (VERBOSE, ANALYZE) users;
VACUUM (VERBOSE, ANALYZE) list_places;
```

### Automated VACUUM Scheduling

#### Option 1: Supabase Dashboard (Recommended)

1. **Access Supabase Dashboard** → Project → Database → Extensions
2. **Enable pg_cron extension** (if not already enabled)
3. **Schedule VACUUM operations**:

```sql
-- Schedule daily VACUUM for high-traffic tables
SELECT cron.schedule(
  'vacuum-lists-daily',
  '0 2 * * *',  -- Daily at 2 AM UTC
  'VACUUM ANALYZE lists;'
);

SELECT cron.schedule(
  'vacuum-users-daily', 
  '0 2 * * *',  -- Daily at 2 AM UTC
  'VACUUM ANALYZE users;'
);

-- Schedule weekly full VACUUM
SELECT cron.schedule(
  'vacuum-full-weekly',
  '0 3 * * 0',  -- Weekly on Sunday at 3 AM UTC
  'VACUUM ANALYZE;'
);
```

#### Option 2: Application-Level Scheduling

Create a maintenance API endpoint for scheduled VACUUM operations:

```typescript
// pages/api/maintenance/vacuum.ts
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Verify maintenance token
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.MAINTENANCE_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Check table bloat before VACUUM
    const { data: bloatData } = await supabase.rpc('check_table_bloat')
    
    // Perform VACUUM on tables with >20% dead rows
    const tablesNeedingVacuum = bloatData?.filter(
      table => table.dead_row_percentage > 20
    )

    for (const table of tablesNeedingVacuum) {
      await supabase.rpc('vacuum_table', { table_name: table.table_name })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      vacuumed_tables: tablesNeedingVacuum.map(t => t.table_name)
    }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500 
    })
  }
}
```

## Monitoring and Alerting

### Database Bloat Monitoring Function

```sql
-- Create function to check table bloat
CREATE OR REPLACE FUNCTION check_table_bloat()
RETURNS TABLE(
  table_name text,
  live_rows bigint,
  dead_rows bigint,
  dead_row_percentage numeric,
  total_size text,
  maintenance_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    relname::text,
    n_live_tup,
    n_dead_tup,
    CASE 
      WHEN n_live_tup > 0 THEN 
        ROUND((n_dead_tup::numeric / (n_live_tup + n_dead_tup)::numeric) * 100, 2)
      ELSE 0 
    END,
    pg_size_pretty(pg_total_relation_size(relid)),
    CASE 
      WHEN n_dead_tup > 100 AND 
           (n_dead_tup::numeric / (n_live_tup + n_dead_tup)::numeric) > 0.2 
      THEN 'URGENT - VACUUM NEEDED'
      WHEN n_dead_tup > 50 AND 
           (n_dead_tup::numeric / (n_live_tup + n_dead_tup)::numeric) > 0.1 
      THEN 'VACUUM RECOMMENDED'
      ELSE 'OK'
    END
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
  ORDER BY (n_dead_tup::numeric / GREATEST(n_live_tup + n_dead_tup, 1)::numeric) DESC;
END;
$$ LANGUAGE plpgsql;
```

### Monitoring Queries

#### Daily Health Check

```sql
-- Quick health check query
SELECT 
  table_name,
  dead_row_percentage,
  maintenance_status
FROM check_table_bloat()
WHERE maintenance_status != 'OK';
```

#### Detailed Bloat Report

```sql
-- Comprehensive bloat analysis
SELECT 
  table_name,
  live_rows,
  dead_rows,
  dead_row_percentage || '%' as bloat_percentage,
  total_size,
  maintenance_status,
  CASE 
    WHEN maintenance_status = 'URGENT - VACUUM NEEDED' THEN 'Execute VACUUM immediately'
    WHEN maintenance_status = 'VACUUM RECOMMENDED' THEN 'Schedule VACUUM within 24 hours'
    ELSE 'Continue monitoring'
  END as recommended_action
FROM check_table_bloat()
ORDER BY dead_row_percentage DESC;
```

### Alerting Thresholds

| Threshold | Action | Frequency |
|-----------|--------|-----------|
| >50% dead rows | **URGENT** - Immediate VACUUM | Real-time alert |
| >20% dead rows | **WARNING** - Schedule VACUUM | Daily check |
| >10% dead rows | **INFO** - Monitor closely | Weekly check |

### Application-Level Monitoring

```typescript
// lib/database/monitoring.ts
export async function checkDatabaseHealth() {
  const { data, error } = await supabase.rpc('check_table_bloat')
  
  if (error) {
    console.error('Database health check failed:', error)
    return { healthy: false, error }
  }

  const urgentTables = data.filter(table => 
    table.maintenance_status === 'URGENT - VACUUM NEEDED'
  )
  
  const warningTables = data.filter(table => 
    table.maintenance_status === 'VACUUM RECOMMENDED'
  )

  // Send alerts if needed
  if (urgentTables.length > 0) {
    await sendUrgentAlert(urgentTables)
  }
  
  if (warningTables.length > 0) {
    await sendWarningAlert(warningTables)
  }

  return {
    healthy: urgentTables.length === 0,
    urgentTables,
    warningTables,
    allTables: data
  }
}
```

## Autovacuum Configuration

### Current Settings Analysis

Based on MCP analysis, current autovacuum settings:

- **autovacuum**: `on` ✅
- **autovacuum_naptime**: `60s` (check interval)
- **autovacuum_vacuum_threshold**: `50` (minimum dead tuples)
- **autovacuum_vacuum_scale_factor**: `0.2` (20% of table size)
- **autovacuum_analyze_threshold**: `50` (minimum for ANALYZE)
- **autovacuum_analyze_scale_factor**: `0.1` (10% of table size)

### Recommended Optimizations

For development/testing environments with frequent data changes:

```sql
-- More aggressive autovacuum for development
ALTER TABLE lists SET (
  autovacuum_vacuum_scale_factor = 0.1,  -- Trigger at 10% instead of 20%
  autovacuum_vacuum_threshold = 25,      -- Lower threshold
  autovacuum_analyze_scale_factor = 0.05, -- More frequent ANALYZE
  autovacuum_analyze_threshold = 25
);

ALTER TABLE users SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_vacuum_threshold = 25,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_analyze_threshold = 25
);

ALTER TABLE list_places SET (
  autovacuum_vacuum_scale_factor = 0.15,
  autovacuum_vacuum_threshold = 50
);
```

## Maintenance Schedule

### Daily (Automated)
- ✅ Health check monitoring
- ✅ Alert on urgent bloat (>50%)
- ✅ VACUUM tables with >20% dead rows

### Weekly (Automated)
- ✅ Full database VACUUM ANALYZE
- ✅ Index maintenance check
- ✅ Performance metrics review

### Monthly (Manual Review)
- 📋 Review autovacuum settings
- 📋 Analyze growth patterns
- 📋 Optimize maintenance schedule
- 📋 Update documentation

## Performance Impact

### VACUUM Operation Timing

Based on current table sizes:
- **lists**: ~8KB table size - VACUUM takes <1ms
- **users**: ~8KB table size - VACUUM takes <1ms  
- **list_places**: ~8KB table size - VACUUM takes <1ms
- **places**: ~24KB table size - VACUUM takes <5ms

### Best Practices

1. **Schedule during low traffic**: 2-4 AM UTC recommended
2. **Monitor during VACUUM**: Use `VACUUM VERBOSE` for logging
3. **Avoid VACUUM FULL**: Use regular VACUUM unless extreme bloat
4. **Combine with ANALYZE**: Always use `VACUUM ANALYZE` for statistics

## Troubleshooting

### Common Issues

#### VACUUM Not Running
```sql
-- Check if autovacuum is enabled
SELECT name, setting FROM pg_settings WHERE name = 'autovacuum';

-- Check autovacuum activity
SELECT * FROM pg_stat_activity WHERE query LIKE '%autovacuum%';
```

#### High Dead Row Accumulation
```sql
-- Check for long-running transactions blocking VACUUM
SELECT pid, state, query_start, query 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;
```

#### VACUUM Performance Issues
```sql
-- Check VACUUM progress (PostgreSQL 13+)
SELECT * FROM pg_stat_progress_vacuum;
```

### Emergency Procedures

#### Critical Bloat (>80% dead rows)
1. **Immediate action**: Schedule emergency VACUUM
2. **Monitor performance**: Check for query slowdowns
3. **Consider VACUUM FULL**: Only if regular VACUUM insufficient
4. **Review autovacuum settings**: Adjust thresholds

#### VACUUM Hanging
1. **Check blocking queries**: Look for long transactions
2. **Monitor system resources**: CPU, memory, I/O
3. **Consider canceling**: Use `pg_cancel_backend(pid)`
4. **Reschedule**: Try during lower activity period

## Integration with Application

### Health Check Endpoint

```typescript
// pages/api/health/database.ts
export default async function handler(req: Request) {
  const health = await checkDatabaseHealth()
  
  return new Response(JSON.stringify({
    status: health.healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    details: {
      urgentTables: health.urgentTables?.length || 0,
      warningTables: health.warningTables?.length || 0,
      recommendations: health.urgentTables?.map(table => 
        `VACUUM ${table.table_name} immediately`
      )
    }
  }))
}
```

### Monitoring Dashboard Integration

```typescript
// components/admin/DatabaseHealth.tsx
export function DatabaseHealthWidget() {
  const [health, setHealth] = useState(null)
  
  useEffect(() => {
    const checkHealth = async () => {
      const response = await fetch('/api/health/database')
      const data = await response.json()
      setHealth(data)
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 300000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="database-health-widget">
      <h3>Database Health</h3>
      <div className={`status ${health?.status}`}>
        Status: {health?.status}
      </div>
      {health?.details?.urgentTables > 0 && (
        <div className="alert urgent">
          {health.details.urgentTables} tables need immediate VACUUM
        </div>
      )}
    </div>
  )
}
```

## Automation Implementation

### ✅ Implemented Features

#### 1. Database Monitoring Functions
- ✅ `check_table_bloat()` - Real-time bloat analysis
- ✅ `get_urgent_maintenance_tables()` - Priority-based maintenance recommendations
- ✅ `get_autovacuum_settings()` - Current autovacuum configuration
- ✅ `log_maintenance_operation()` - Maintenance activity logging
- ✅ `get_maintenance_commands()` - Executable VACUUM commands

#### 2. API Endpoints
- ✅ `GET /api/health/database` - Real-time health check endpoint
- ✅ `GET /api/maintenance/report` - Downloadable maintenance reports
- ✅ `POST /api/maintenance/report` - JSON format reports

#### 3. Automation Scripts
- ✅ `scripts/database-maintenance.js` - Comprehensive maintenance automation
- ✅ Slack integration for alerts
- ✅ Dry-run mode for testing
- ✅ Comprehensive logging and reporting

#### 4. Optimized Autovacuum Settings
Applied to critical tables:
```sql
-- Lists table (85.71% dead rows → optimized)
ALTER TABLE lists SET (
  autovacuum_vacuum_scale_factor = 0.1,  -- 10% threshold
  autovacuum_vacuum_threshold = 10
);

-- Users table (83.33% dead rows → optimized)  
ALTER TABLE users SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_vacuum_threshold = 10
);

-- List_places table (28% dead rows → optimized)
ALTER TABLE list_places SET (
  autovacuum_vacuum_scale_factor = 0.15,
  autovacuum_vacuum_threshold = 25
);
```

### Automated Scheduling Options

#### Option 1: Cron Job (Recommended)
```bash
# Add to crontab (crontab -e)
# Run maintenance check every 30 minutes
*/30 * * * * cd /path/to/wanderlist && node scripts/database-maintenance.js --verbose

# Generate daily reports at 6 AM
0 6 * * * cd /path/to/wanderlist && node scripts/database-maintenance.js --report-only --verbose

# Force maintenance on weekends (if needed)
0 3 * * 0 cd /path/to/wanderlist && node scripts/database-maintenance.js --force --verbose
```

#### Option 2: GitHub Actions (CI/CD Integration)
```yaml
# .github/workflows/database-maintenance.yml
name: Database Maintenance
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: node scripts/database-maintenance.js --verbose
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### Option 3: Vercel Cron Jobs
```typescript
// api/cron/database-maintenance.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth, generateMaintenanceReport } from '@/lib/database/monitoring'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const health = await checkDatabaseHealth()
    
    if (!health.healthy) {
      // Send alerts for urgent issues
      console.error('🚨 Database maintenance required:', health.urgentTables)
    }
    
    return NextResponse.json({
      success: true,
      healthy: health.healthy,
      urgentTables: health.urgentTables.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
```

### Real-Time Monitoring Integration

#### Frontend Health Widget
```typescript
// components/admin/DatabaseHealthWidget.tsx
import { useEffect, useState } from 'react'

interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'error'
  urgentTables: number
  warningTables: number
  recommendations: string[]
}

export function DatabaseHealthWidget() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health/database')
        const data = await response.json()
        setHealth(data)
      } catch (error) {
        console.error('Health check failed:', error)
        setHealth({ 
          status: 'error', 
          urgentTables: 0, 
          warningTables: 0, 
          recommendations: [] 
        })
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 300000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  if (loading) return <div>Checking database health...</div>

  return (
    <div className={`health-widget ${health?.status}`}>
      <h3>Database Health</h3>
      <div className={`status-indicator ${health?.status}`}>
        {health?.status === 'healthy' ? '✅' : health?.status === 'degraded' ? '⚠️' : '❌'}
        Status: {health?.status}
      </div>
      
      {health?.urgentTables > 0 && (
        <div className="alert urgent">
          🚨 {health.urgentTables} tables need immediate VACUUM
        </div>
      )}
      
      {health?.warningTables > 0 && (
        <div className="alert warning">
          ⚠️ {health.warningTables} tables need maintenance
        </div>
      )}
      
      {health?.recommendations.length > 0 && (
        <details>
          <summary>Recommendations ({health.recommendations.length})</summary>
          <ul>
            {health.recommendations.map((rec, i) => (
              <li key={i}><code>{rec}</code></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
```

### Usage Examples

#### Manual Health Check
```bash
# Check current database health
curl http://localhost:3000/api/health/database

# Generate maintenance report
curl http://localhost:3000/api/maintenance/report > maintenance-report.md
```

#### Automated Maintenance Script
```bash
# Dry run (see what would be done)
node scripts/database-maintenance.js --dry-run --verbose

# Execute critical maintenance only
node scripts/database-maintenance.js --verbose

# Force all maintenance operations
node scripts/database-maintenance.js --force --verbose

# Generate report only
node scripts/database-maintenance.js --report-only
```

#### Environment Variables for Automation
```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional - for alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Optional - for cron authentication
CRON_SECRET=your-secret-key
```

### Monitoring Dashboard Integration

The health check can be integrated into existing monitoring systems:

#### Prometheus Metrics
```typescript
// lib/metrics/database.ts
export async function getDatabaseMetrics() {
  const health = await checkDatabaseHealth()
  
  return {
    database_health_status: health.healthy ? 1 : 0,
    database_urgent_tables: health.urgentTables.length,
    database_warning_tables: health.warningTables.length,
    database_total_tables: health.summary.totalTables
  }
}
```

#### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Database Health",
    "panels": [
      {
        "title": "Database Status",
        "type": "stat",
        "targets": [
          {
            "expr": "database_health_status",
            "legendFormat": "Healthy"
          }
        ]
      },
      {
        "title": "Tables Needing Maintenance",
        "type": "graph",
        "targets": [
          {
            "expr": "database_urgent_tables",
            "legendFormat": "Urgent"
          },
          {
            "expr": "database_warning_tables", 
            "legendFormat": "Warning"
          }
        ]
      }
    ]
  }
}
```

## References

- [PostgreSQL VACUUM Documentation](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [Supabase Database Management](https://supabase.com/docs/guides/database)
- [MCP Analysis Results](../performance/PERFORMANCE_BASELINE.md)

---

**Last Updated**: 2025-06-10  
**Next Review**: 2025-07-10  
**Maintained By**: Development Team 