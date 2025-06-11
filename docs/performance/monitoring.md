# 📊 Performance Monitoring Guide

This document provides comprehensive guidance on monitoring Wanderlist's performance, including tools setup, key metrics, dashboards, and MCP-powered database analysis.

## 🎯 Overview

Performance monitoring in Wanderlist is implemented across multiple layers to provide complete visibility into application performance, from user experience metrics to database query optimization.

### **Monitoring Philosophy**
- **Proactive**: Identify issues before they impact users
- **Comprehensive**: Monitor all layers of the application stack
- **Actionable**: Provide clear insights for optimization decisions
- **Automated**: Minimize manual monitoring overhead
- **Real-time**: Enable quick response to performance issues

## 🛠️ Monitoring Tools & Setup

### **1. Vercel Analytics**

#### **Setup**
```bash
# Already integrated in production deployment
# Access via: https://vercel.com/dashboard/analytics
```

#### **Metrics Tracked**
- **Core Web Vitals**: LCP, FID, CLS scores
- **Page Load Performance**: TTFB, FCP, LCP timing
- **User Experience**: Bounce rate, session duration
- **Geographic Performance**: Performance by region
- **Device Performance**: Mobile vs desktop metrics

#### **Key Dashboards**
- **Real User Monitoring (RUM)**: Live user experience data
- **Performance Insights**: Optimization recommendations
- **Core Web Vitals**: Google ranking factors
- **Audience Analytics**: User behavior and performance correlation

### **2. Supabase Dashboard**

#### **Setup**
```bash
# Access via: https://supabase.com/dashboard/project/tbabdwdhostkadpwwbhy
# Navigate to: Database > Performance
```

#### **Database Metrics**
- **Query Performance**: Execution time, frequency, optimization opportunities
- **Connection Pool**: Active connections, pool utilization
- **Table Statistics**: Row counts, table sizes, index usage
- **Real-time Metrics**: Active subscriptions, message throughput

#### **Key Monitoring Areas**
```sql
-- Query performance monitoring
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Table bloat monitoring
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  ROUND(n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) as dead_row_percentage
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY dead_row_percentage DESC;
```

### **3. MCP Performance Analysis**

#### **Setup & Usage**
```bash
# MCP integration already configured
# Use Cursor with Supabase MCP for real-time analysis

# Example MCP commands for performance monitoring:
"Analyze query performance for getUserLists function"
"Check table bloat across all tables"
"Show slow queries from the last hour"
"Analyze index usage for lists table"
```

#### **MCP Performance Commands**
```typescript
// Real-time query analysis
mcp_supabase_execute_sql({
  project_id: "tbabdwdhostkadpwwbhy",
  query: "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT * FROM get_user_lists($1)"
});

// Database health check
mcp_supabase_execute_sql({
  project_id: "tbabdwdhostkadpwwbhy", 
  query: "SELECT * FROM check_table_bloat()"
});

// Performance monitoring functions
mcp_supabase_execute_sql({
  project_id: "tbabdwdhostkadpwwbhy",
  query: "SELECT * FROM get_maintenance_commands()"
});
```

### **4. Custom Performance Utility**

#### **Setup**
```typescript
// src/lib/utils/performance.ts - Already implemented
import { perf } from '@/lib/utils/performance';

// Component performance monitoring
const renderTimer = perf.component('ComponentName', 'render');
renderTimer.start();
// ... component logic
renderTimer.end();

// API performance monitoring
const apiTimer = perf.api('GET', '/api/lists');
apiTimer.start();
const response = await fetch('/api/lists');
apiTimer.end(response.status, response.headers.get('content-length'));

// Custom operation monitoring
const operationTimer = perf.operation('complexCalculation');
operationTimer.start();
// ... complex operation
operationTimer.end();
```

#### **Performance Thresholds**
```typescript
// Automatic performance classification
API Calls:
🚀 < 100ms (Excellent)
⚡ < 500ms (Good) 
🟡 < 1000ms (Acceptable)
🟠 < 3000ms (Slow)
🔴 ≥ 3000ms (Critical)

Components:
🚀 < 16ms (60fps)
⚡ < 33ms (30fps)
🟡 < 50ms (Acceptable)
🔴 ≥ 50ms (Critical)
```

### **5. Google PageSpeed Insights**

#### **Setup & Usage**
```bash
# Automated testing via URL
https://pagespeed.web.dev/analysis?url=https://wanderlist.vercel.app

# Key metrics monitored:
# - Performance Score (0-100)
# - Core Web Vitals (LCP, FID, CLS)
# - Optimization Opportunities
# - Diagnostics and Recommendations
```

#### **Monitoring Schedule**
- **Weekly**: Full PageSpeed analysis
- **After deployments**: Performance regression testing
- **Monthly**: Comprehensive performance review

## 📈 Key Performance Metrics

### **1. User Experience Metrics**

#### **Core Web Vitals**
```typescript
// Target thresholds
const coreWebVitals = {
  LCP: {
    good: "< 2.5s",
    needsImprovement: "2.5s - 4.0s", 
    poor: "> 4.0s"
  },
  FID: {
    good: "< 100ms",
    needsImprovement: "100ms - 300ms",
    poor: "> 300ms"
  },
  CLS: {
    good: "< 0.1",
    needsImprovement: "0.1 - 0.25",
    poor: "> 0.25"
  }
};
```

#### **Application Performance**
- **Time to First Byte (TTFB)**: < 200ms
- **First Contentful Paint (FCP)**: < 1.8s
- **Time to Interactive (TTI)**: < 3.0s
- **Total Blocking Time (TBT)**: < 200ms

### **2. Database Performance Metrics**

#### **Query Performance**
```sql
-- Current performance benchmarks
getUserLists: 0.093ms (Excellent)
getPublicLists: 0.146ms (Excellent)
searchPlaces: < 50ms (Good)
updateUserProfile: < 25ms (Excellent)
```

#### **Database Health**
```sql
-- Table bloat monitoring thresholds
GOOD: < 10% dead rows
WARNING: 10-20% dead rows  
CRITICAL: > 20% dead rows

-- Connection pool monitoring
GOOD: < 80% pool utilization
WARNING: 80-90% pool utilization
CRITICAL: > 90% pool utilization
```

### **3. API Performance Metrics**

#### **Response Time Targets**
```typescript
const apiTargets = {
  "/api/lists": "< 100ms",
  "/api/places/search": "< 200ms", 
  "/api/users/profile": "< 150ms",
  "/api/auth/*": "< 100ms"
};
```

#### **Error Rate Thresholds**
- **Good**: < 1% error rate
- **Warning**: 1-5% error rate
- **Critical**: > 5% error rate

### **4. Component Performance Metrics**

#### **Re-render Tracking**
```typescript
// Component re-render frequency (per user interaction)
const componentTargets = {
  ListsHeader: "0-1 re-renders",
  ListsGrid: "0-1 re-renders", 
  ListItem: "0 re-renders (unless data changed)",
  SearchInput: "1 re-render per keystroke"
};
```

## 🔍 Performance Monitoring Workflows

### **1. Daily Monitoring Routine**

#### **Automated Checks**
```bash
# Database health check (via MCP)
"Check database health and table bloat status"

# API performance check
curl -w "@curl-format.txt" -s -o /dev/null https://wanderlist.vercel.app/api/health

# Core Web Vitals check
# Automated via Vercel Analytics dashboard
```

#### **Manual Reviews**
- **Vercel Analytics**: Check for performance regressions
- **Supabase Dashboard**: Review query performance and connection usage
- **Error Logs**: Identify and investigate performance-related errors

### **2. Weekly Performance Review**

#### **Comprehensive Analysis**
```bash
# MCP-powered weekly analysis
"Generate performance report for the last week"
"Identify slow queries and optimization opportunities" 
"Check for database maintenance needs"
"Analyze component re-render patterns"
```

#### **Performance Report Template**
```markdown
## Weekly Performance Report

### Database Performance
- Average query time: X.XXXms
- Slowest queries: [list top 5]
- Table bloat status: [percentage by table]
- Maintenance actions taken: [list actions]

### Frontend Performance  
- Core Web Vitals scores: LCP/FID/CLS
- Component re-render reduction: X%
- Bundle size: XXXkB gzipped
- Performance regressions: [list any issues]

### API Performance
- Average response times by endpoint
- Error rates by endpoint  
- Cache hit ratios
- Optimization opportunities: [list recommendations]
```

### **3. Performance Incident Response**

#### **Alert Thresholds**
```typescript
const alertThresholds = {
  database: {
    queryTime: "> 1000ms",
    connectionPool: "> 90%",
    errorRate: "> 5%"
  },
  frontend: {
    LCP: "> 4.0s",
    FID: "> 300ms", 
    CLS: "> 0.25"
  },
  api: {
    responseTime: "> 3000ms",
    errorRate: "> 5%",
    availability: "< 99%"
  }
};
```

#### **Incident Response Workflow**
1. **Detection**: Automated alerts or manual discovery
2. **Assessment**: Use MCP tools for rapid diagnosis
3. **Mitigation**: Apply immediate fixes (caching, query optimization)
4. **Resolution**: Implement permanent solution
5. **Post-mortem**: Document lessons learned and prevention measures

## 🚨 Performance Alerting

### **1. Database Alerts**

#### **Critical Alerts**
```sql
-- Query performance degradation
SELECT 'CRITICAL: Slow query detected' as alert
WHERE EXISTS (
  SELECT 1 FROM pg_stat_statements 
  WHERE mean_exec_time > 1000 -- 1 second
);

-- Table bloat critical threshold
SELECT 'CRITICAL: High table bloat' as alert
WHERE EXISTS (
  SELECT 1 FROM check_table_bloat()
  WHERE dead_row_percentage > 50
);
```

#### **Warning Alerts**
```sql
-- Connection pool utilization
SELECT 'WARNING: High connection usage' as alert
WHERE (
  SELECT count(*) FROM pg_stat_activity 
  WHERE state = 'active'
) > 80; -- 80% of connection limit
```

### **2. Frontend Alerts**

#### **Core Web Vitals Degradation**
```typescript
// Automated via Vercel Analytics
// Alerts when Core Web Vitals fall below thresholds
const webVitalsAlerts = {
  LCP: "> 2.5s for 75th percentile",
  FID: "> 100ms for 75th percentile", 
  CLS: "> 0.1 for 75th percentile"
};
```

### **3. API Performance Alerts**

#### **Response Time Alerts**
```bash
# Health check endpoint monitoring
curl -w "%{time_total}" -s -o /dev/null https://wanderlist.vercel.app/api/health

# Alert if response time > 3 seconds
```

## 📊 Performance Dashboards

### **1. Executive Dashboard**

#### **Key Metrics Overview**
- **Overall Performance Score**: Composite score from all metrics
- **User Experience**: Core Web Vitals trends
- **System Health**: Database and API status
- **Performance Trends**: Week-over-week comparisons

### **2. Development Dashboard**

#### **Technical Metrics**
- **Component Performance**: Re-render frequency and optimization opportunities
- **Database Performance**: Query times, index usage, bloat status
- **API Performance**: Response times, error rates, cache efficiency
- **Bundle Analysis**: Size trends and optimization opportunities

### **3. Real-time Monitoring**

#### **Live Metrics**
```typescript
// Real-time performance monitoring
const liveMetrics = {
  activeUsers: "Real-time user count",
  databaseConnections: "Active DB connections", 
  apiResponseTimes: "Current API performance",
  errorRates: "Real-time error tracking"
};
```

## 🔧 Performance Optimization Workflow

### **1. Performance Issue Detection**
1. **Automated Alerts**: Threshold-based notifications
2. **Manual Discovery**: Regular dashboard reviews
3. **User Reports**: Performance complaints or feedback
4. **Proactive Analysis**: Regular performance audits

### **2. Performance Analysis**
```bash
# MCP-powered analysis workflow
"Analyze performance issue in [component/query/endpoint]"
"Identify root cause of performance degradation"
"Suggest optimization strategies"
"Estimate performance improvement potential"
```

### **3. Optimization Implementation**
1. **Quick Wins**: Immediate optimizations (caching, indexing)
2. **Component Optimization**: React.memo, props optimization
3. **Database Optimization**: Query tuning, index creation
4. **Architecture Changes**: Fundamental performance improvements

### **4. Performance Validation**
```bash
# Post-optimization validation
"Measure performance improvement after optimization"
"Compare before/after metrics"
"Validate optimization effectiveness"
"Document performance gains"
```

## 🎯 Performance Goals & SLAs

### **Service Level Objectives (SLOs)**
```typescript
const performanceSLOs = {
  availability: "99.9% uptime",
  responseTime: "95% of requests < 200ms",
  databaseQueries: "95% of queries < 100ms", 
  coreWebVitals: "75% of users experience 'Good' scores",
  errorRate: "< 1% error rate across all endpoints"
};
```

### **Performance Improvement Targets**
- **Q1 2025**: Achieve all current SLOs consistently
- **Q2 2025**: Implement virtual scrolling and advanced caching
- **Q3 2025**: Optimize for 10K+ concurrent users
- **Q4 2025**: Implement edge computing and advanced optimization

## 🔗 Related Documentation

- **[Performance Baseline](./PERFORMANCE_BASELINE.md)** - Comprehensive performance analysis
- **[Optimization Summary](./OPTIMIZATION_SUMMARY.md)** - Component optimization details
- **[Database Performance](../database/performance.md)** - Database-specific optimization
- **[Component Optimization](../components/optimization.md)** - React performance patterns

---

*📊 Performance monitoring is continuously evolving. This guide reflects current best practices as of June 10, 2025.* 