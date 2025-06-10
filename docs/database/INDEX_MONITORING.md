# Index Monitoring and Optimization Guide

This guide covers the comprehensive index monitoring system implemented for ongoing database performance optimization.

## Overview

The index monitoring system provides real-time analysis of index usage patterns, identifies unused indexes, suggests missing indexes, and provides automated alerts for performance issues.

## Current Index Status

Based on the latest MCP analysis (as of implementation):

### Summary Statistics
- **Total Indexes**: 101 indexes across all tables
- **Unused Indexes**: 67 indexes (66% unused)
- **High-Waste Indexes**: 12 indexes consuming 24KB+ each
- **Overall Efficiency**: 34% (needs improvement)

### Critical Findings

#### High-Priority Unused Indexes (24KB+ each)
These indexes are consuming significant disk space and should be considered for removal:

1. **places.idx_places_address_trgm** (40 kB) - GIN trigram index for address search
2. **lists.idx_lists_name_trgm_public** (24 kB) - GIN trigram index for public list name search
3. **lists.idx_lists_description_trgm_public** (24 kB) - GIN trigram index for description search
4. **lists.idx_lists_city_trgm_public** (24 kB) - GIN trigram index for city search
5. **users.idx_users_preferences_gin** (24 kB) - GIN index for user preferences
6. **list_places.idx_list_places_tags_gin** (24 kB) - GIN index for place tags
7. **lists.idx_lists_tags_gin** (24 kB) - GIN index for list tags
8. **places.idx_places_types_gin** (24 kB) - GIN index for place types
9. **lists.idx_lists_metadata_gin** (24 kB) - GIN index for list metadata
10. **places.idx_places_name_trgm** (24 kB) - GIN trigram index for place name search
11. **users.idx_users_metadata_gin** (24 kB) - GIN index for user metadata
12. **users.idx_users_social_links_gin** (24 kB) - GIN index for social links

#### Well-Performing Indexes
These indexes show high usage and should be maintained:

1. **lists.lists_pkey** - 2,423 scans (HIGH_USAGE)
2. **places.places_pkey** - 1,180 scans (HIGH_USAGE)
3. **users.users_pkey** - 475 scans (HIGH_USAGE)
4. **lists.idx_lists_user_public_updated** - 399 scans (HIGH_USAGE)
5. **list_places.idx_list_places_order** - 192 scans (HIGH_USAGE)

## Monitoring Functions

### Database Functions

The system includes several PostgreSQL functions for real-time monitoring:

#### `analyze_index_usage()`
Returns comprehensive index usage analysis with efficiency metrics.

```sql
SELECT * FROM analyze_index_usage() 
WHERE priority IN ('HIGH', 'CRITICAL')
ORDER BY priority, scan_count;
```

#### `get_unused_indexes()`
Identifies indexes that have never been used and can be safely dropped.

```sql
SELECT * FROM get_unused_indexes() 
WHERE space_wasted = 'HIGH';
```

#### `suggest_missing_indexes()`
Suggests new indexes based on common query patterns.

```sql
SELECT * FROM suggest_missing_indexes();
```

#### `get_index_size_summary()`
Provides size and efficiency summary by table.

```sql
SELECT * FROM get_index_size_summary()
ORDER BY efficiency_score ASC;
```

#### `record_index_usage_snapshot()`
Records current usage statistics for historical tracking.

```sql
SELECT record_index_usage_snapshot();
```

### TypeScript Monitoring Functions

The monitoring utility provides several functions for application-level monitoring:

```typescript
import { 
  analyzeIndexUsage,
  getUnusedIndexes,
  getMissingIndexSuggestions,
  generateIndexMonitoringReport,
  checkIndexHealth
} from '@/lib/database/monitoring'

// Generate comprehensive report
const report = await generateIndexMonitoringReport()

// Check for issues and send alerts
const health = await checkIndexHealth()
```

## API Endpoints

### GET `/api/monitoring/indexes`

Provides various index monitoring data based on the `action` parameter:

#### Get Full Report
```bash
curl "http://localhost:3000/api/monitoring/indexes?action=report"
```

#### Check Index Health
```bash
curl "http://localhost:3000/api/monitoring/indexes?action=health"
```

#### Get Usage Analysis
```bash
curl "http://localhost:3000/api/monitoring/indexes?action=usage"
```

#### Get Unused Indexes
```bash
curl "http://localhost:3000/api/monitoring/indexes?action=unused"
```

#### Get Missing Index Suggestions
```bash
curl "http://localhost:3000/api/monitoring/indexes?action=missing"
```

#### Get Optimization Suggestions
```bash
curl "http://localhost:3000/api/monitoring/indexes?action=suggestions"
```

### POST `/api/monitoring/indexes`

Execute monitoring actions:

#### Record Usage Snapshot
```bash
curl -X POST "http://localhost:3000/api/monitoring/indexes" \
  -H "Content-Type: application/json" \
  -d '{"action": "snapshot"}'
```

## Automation Scripts

### Index Monitoring Script

The `scripts/index-monitoring.js` script provides comprehensive automation:

#### Basic Usage
```bash
# Generate report
node scripts/index-monitoring.js

# Record usage snapshot
node scripts/index-monitoring.js --snapshot

# Generate report with verbose output
node scripts/index-monitoring.js --verbose

# Generate JSON report
node scripts/index-monitoring.js --format json

# Report only (no actions)
node scripts/index-monitoring.js --report-only
```

#### Environment Variables
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..." # Optional
export LOG_LEVEL="info" # debug, info, warn, error
```

#### Cron Job Setup

For automated monitoring, set up cron jobs:

```bash
# Record usage snapshots every hour
0 * * * * cd /path/to/wanderlist && node scripts/index-monitoring.js --snapshot

# Generate daily reports
0 9 * * * cd /path/to/wanderlist && node scripts/index-monitoring.js --format markdown > /var/log/index-reports/$(date +\%Y-\%m-\%d).md

# Weekly comprehensive analysis with alerts
0 9 * * 1 cd /path/to/wanderlist && node scripts/index-monitoring.js --verbose
```

## Alert Thresholds

The system sends alerts when these conditions are met:

- **Unused Indexes**: > 10 unused indexes
- **Wasted Space**: > 50MB of wasted index space
- **Efficiency**: < 50% overall index efficiency
- **High Priority Issues**: > 5 high-priority performance issues

### Slack Integration

Configure Slack alerts by setting the `SLACK_WEBHOOK_URL` environment variable:

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
```

Alerts include:
- Overall efficiency percentage
- Number of unused indexes
- Wasted disk space
- High-priority issues count
- Critical recommendations

## Optimization Recommendations

### Immediate Actions (High Priority)

1. **Drop High-Waste Unused Indexes**
   ```sql
   -- Example: Drop unused trigram indexes
   DROP INDEX IF EXISTS idx_places_address_trgm;
   DROP INDEX IF EXISTS idx_lists_name_trgm_public;
   DROP INDEX IF EXISTS idx_lists_description_trgm_public;
   ```

2. **Create Missing High-Priority Indexes**
   ```sql
   -- Geospatial index for location queries
   CREATE INDEX idx_places_location_gist ON places 
   USING gist (ll_to_earth(latitude, longitude));
   ```

### Medium Priority Actions

1. **Review Low-Usage Indexes**
   - Monitor indexes with < 10 scans over time
   - Consider dropping if usage doesn't increase

2. **Optimize Table-Specific Strategies**
   - **lists table**: 32% efficiency (17/25 indexes unused)
   - **list_places table**: 37.5% efficiency (10/16 indexes unused)
   - **users table**: 30.77% efficiency (9/13 indexes unused)
   - **places table**: 20% efficiency (8/10 indexes unused)

### Long-term Monitoring

1. **Weekly Index Reviews**
   - Run comprehensive reports
   - Track efficiency trends
   - Monitor new query patterns

2. **Quarterly Index Audits**
   - Review all unused indexes
   - Analyze query performance improvements
   - Update index strategy based on usage patterns

## Performance Impact

### Expected Improvements

After implementing recommendations:

1. **Disk Space Savings**: ~300KB immediate savings from dropping high-waste indexes
2. **Query Performance**: 10-20% improvement for geospatial queries with proper GiST index
3. **Maintenance Overhead**: Reduced by eliminating unused indexes
4. **Overall Efficiency**: Target 70%+ efficiency score

### Monitoring Metrics

Track these metrics over time:

- **Index Efficiency Score**: Target > 70%
- **Unused Index Count**: Target < 5
- **Wasted Space**: Target < 10MB
- **High Priority Issues**: Target 0

## Integration with Existing Monitoring

### Database Health Dashboard

The index monitoring integrates with the existing database health system:

```typescript
// Combined health check
const [dbHealth, indexHealth] = await Promise.all([
  checkDatabaseHealth(),
  checkIndexHealth()
])

// Unified alerting
if (!dbHealth.healthy || !indexHealth.healthy) {
  await sendCombinedAlert(dbHealth, indexHealth)
}
```

### Maintenance Reports

Index monitoring data is included in maintenance reports:

```typescript
const report = await generateMaintenanceReport()
// Now includes index analysis alongside table bloat information
```

## Troubleshooting

### Common Issues

1. **Function Not Found Errors**
   - Ensure all monitoring functions are deployed via migrations
   - Check function permissions for authenticated users

2. **Permission Errors**
   - Verify service role key has necessary permissions
   - Check RLS policies don't interfere with monitoring functions

3. **Performance Issues**
   - Index analysis queries are read-only and safe
   - Snapshot recording is lightweight (< 1 second)
   - Use `--report-only` flag for read-only operations

### Debugging

Enable verbose logging:

```bash
# Script debugging
node scripts/index-monitoring.js --verbose

# API debugging
LOG_LEVEL=debug npm run dev
```

## Future Enhancements

### Planned Features

1. **Historical Trend Analysis**
   - Track index usage changes over time
   - Identify seasonal patterns
   - Predict future index needs

2. **Automated Index Management**
   - Safe automated dropping of unused indexes
   - Automatic creation of high-value missing indexes
   - Smart index consolidation

3. **Query Pattern Analysis**
   - Integration with pg_stat_statements
   - Correlation between queries and index usage
   - Proactive index suggestions

4. **Performance Benchmarking**
   - Before/after performance measurements
   - Query execution time tracking
   - Index impact quantification

## Best Practices

### Index Monitoring

1. **Regular Monitoring**: Run reports weekly
2. **Gradual Changes**: Drop indexes incrementally
3. **Performance Testing**: Test impact of index changes
4. **Documentation**: Track all index modifications

### Safety Guidelines

1. **Never Drop Primary Keys**: System prevents this automatically
2. **Never Drop Unique Constraints**: System prevents this automatically
3. **Test in Development**: Always test index changes in dev environment
4. **Monitor After Changes**: Watch performance metrics after modifications
5. **Keep Backups**: Ensure database backups before major index changes

## Conclusion

The index monitoring system provides comprehensive visibility into database index performance, enabling data-driven optimization decisions. Regular monitoring and gradual optimization will significantly improve database performance and reduce storage overhead.

For questions or issues, refer to the troubleshooting section or check the monitoring logs for detailed error information. 