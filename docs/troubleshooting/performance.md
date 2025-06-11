# ⚡ Performance Troubleshooting

This guide covers performance issues including slow queries, frontend rendering problems, component re-render loops, memory leaks, and optimization strategies.

## 🚨 Quick Fixes for Critical Performance Issues

### **🔥 App Completely Unresponsive**
```bash
# 1. Check for infinite loops in browser console
# F12 → Console → Look for repeated errors

# 2. Check React DevTools for re-render storms
# React DevTools → Profiler → Record and analyze

# 3. Check database query performance
# Supabase Dashboard → Logs → Filter by slow queries

# 4. Clear all caches and restart
rm -rf .next node_modules
npm install && npm run dev
```

### **🔥 Database Queries Extremely Slow**
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

-- Check slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### **🔥 Frontend Completely Laggy**
```javascript
// Check for memory leaks in browser console
console.log('Memory usage:', performance.memory)

// Check for excessive re-renders
// React DevTools → Profiler → Look for high render counts

// Check for large bundle sizes
// Network tab → Check JS bundle sizes
```

---

## 🔍 Performance Issue Categories

### **1. Database Performance Issues**

#### **Slow Query Performance**

##### **Symptoms**
- Page loads take > 3 seconds
- Database timeouts
- High CPU usage in Supabase dashboard

##### **Debugging Steps**
```sql
-- Analyze specific query performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT * FROM get_user_lists_with_counts('user-id');

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Check table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

##### **Common Solutions**

###### **Add Missing Indexes**
```sql
-- For user lists queries
CREATE INDEX idx_lists_user_public_updated 
ON lists(user_id, is_public, updated_at DESC);

-- For place searches
CREATE INDEX idx_places_location_gin 
ON places USING GIN(location);

-- For list-place relationships
CREATE INDEX idx_list_places_composite 
ON list_places(list_id, place_id, created_at);
```

###### **Optimize with Database Functions**
```sql
-- Replace multiple API calls with single function
CREATE OR REPLACE FUNCTION get_user_lists_optimized(p_user_id UUID)
RETURNS TABLE(
  list_data JSONB,
  place_count INTEGER,
  view_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(l.*) as list_data,
    COALESCE(pc.count, 0)::INTEGER as place_count,
    l.view_count
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

### **2. Frontend Performance Issues**

#### **Component Re-render Issues**

##### **Symptoms**
- UI feels laggy during interactions
- High CPU usage in browser
- Slow typing in input fields
- Stuttering animations

##### **Debugging with React DevTools**
```javascript
// Install React DevTools browser extension
// 1. Open React DevTools
// 2. Go to Profiler tab
// 3. Click Record
// 4. Interact with slow component
// 5. Stop recording and analyze

// Look for:
// - High render counts
// - Long render times
// - Unnecessary re-renders
```

##### **Common Causes & Solutions**

###### **Unnecessary Re-renders**
```typescript
// Problem: Component re-renders on every parent update
function ListItem({ list, onUpdate, onDelete, isSelected }) {
  return <div>{list.name}</div>
}

// Solution: Memoize component with grouped props
const ListItem = React.memo<ListItemProps>(({ 
  list, 
  actions, 
  isSelected 
}) => {
  return <div>{list.name}</div>
})

// Group related props
const actions = useMemo(() => ({
  onUpdate,
  onDelete
}), [onUpdate, onDelete])
```

###### **Expensive Calculations in Render**
```typescript
// Problem: Expensive calculation on every render
function ListsPage() {
  const sortedLists = lists.sort((a, b) => b.updatedAt - a.updatedAt) // Runs every render
  return <div>{sortedLists.map(...)}</div>
}

// Solution: Memoize expensive calculations
function ListsPage() {
  const sortedLists = useMemo(() => 
    lists.sort((a, b) => b.updatedAt - a.updatedAt),
    [lists]
  )
  return <div>{sortedLists.map(...)}</div>
}
```

###### **Object/Array Recreation**
```typescript
// Problem: New objects created on every render
function ListsHeader({ onSort }) {
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date' }
  ] // New array every render
  
  return <SortControl options={sortOptions} onSort={onSort} />
}

// Solution: Move static data outside component or memoize
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date' }
]

function ListsHeader({ onSort }) {
  return <SortControl options={SORT_OPTIONS} onSort={onSort} />
}
```

---

### **3. Memory Leak Issues**

#### **Symptoms**
- Browser becomes slower over time
- High memory usage in Task Manager
- App crashes after extended use

#### **Debugging Memory Leaks**
```javascript
// Check memory usage in browser console
console.log('Memory usage:', {
  used: performance.memory.usedJSHeapSize,
  total: performance.memory.totalJSHeapSize,
  limit: performance.memory.jsHeapSizeLimit
})

// Monitor memory over time
setInterval(() => {
  console.log('Memory:', performance.memory.usedJSHeapSize)
}, 5000)
```

#### **Common Memory Leak Causes**

##### **Event Listeners Not Cleaned Up**
```typescript
// Problem: Event listeners not removed
useEffect(() => {
  const handleResize = () => setWindowSize(window.innerWidth)
  window.addEventListener('resize', handleResize)
  // Missing cleanup!
}, [])

// Solution: Clean up event listeners
useEffect(() => {
  const handleResize = () => setWindowSize(window.innerWidth)
  window.addEventListener('resize', handleResize)
  
  return () => {
    window.removeEventListener('resize', handleResize)
  }
}, [])
```

##### **Subscriptions Not Unsubscribed**
```typescript
// Problem: Supabase subscriptions not cleaned up
useEffect(() => {
  const subscription = supabase
    .channel('lists')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, 
        (payload) => console.log(payload))
    .subscribe()
  // Missing cleanup!
}, [])

// Solution: Unsubscribe on cleanup
useEffect(() => {
  const subscription = supabase
    .channel('lists')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, 
        (payload) => console.log(payload))
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

##### **Timers Not Cleared**
```typescript
// Problem: Timers not cleared
useEffect(() => {
  const timer = setInterval(() => {
    fetchUpdates()
  }, 5000)
  // Missing cleanup!
}, [])

// Solution: Clear timers
useEffect(() => {
  const timer = setInterval(() => {
    fetchUpdates()
  }, 5000)
  
  return () => {
    clearInterval(timer)
  }
}, [])
```

---

### **4. Network Performance Issues**

#### **Slow API Responses**

##### **Debugging Network Issues**
```bash
# Check API response times in browser
# F12 → Network tab → Look for slow requests

# Test API endpoints directly
curl -w "@curl-format.txt" -o /dev/null -s "https://your-domain.com/api/lists"

# curl-format.txt content:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n
```

##### **Optimization Strategies**

###### **Implement Request Caching**
```typescript
// Add caching headers to API responses
export async function GET(request: Request) {
  const data = await fetchData()
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}
```

###### **Use Database Functions**
```typescript
// Problem: Multiple API calls
const lists = await fetch('/api/lists')
const places = await fetch('/api/places')
const stats = await fetch('/api/stats')

// Solution: Single optimized database function
const { data } = await supabase.rpc('get_dashboard_data', { user_id })
```

###### **Implement Parallel Requests**
```typescript
// Problem: Sequential API calls
const lists = await fetchLists()
const places = await fetchPlaces()

// Solution: Parallel requests
const [lists, places] = await Promise.all([
  fetchLists(),
  fetchPlaces()
])
```

---

## 🛠️ Performance Monitoring Tools

### **Built-in Performance Utility**
```typescript
// Use the custom performance monitoring utility
import { PerformanceMonitor } from '@/lib/utils/performance'

const perf = new PerformanceMonitor()

// Monitor component renders
const renderTimer = perf.component('ListsPage', 'render')
renderTimer.start()
// ... component logic
renderTimer.end()

// Monitor API calls
const apiTimer = perf.api('GET', '/api/lists')
apiTimer.start()
const response = await fetch('/api/lists')
apiTimer.end(response.status, response.headers.get('content-length'))

// Monitor custom operations
const customTimer = perf.custom('search', 'filter-lists')
customTimer.start()
const filteredLists = filterLists(lists, searchTerm)
customTimer.end()
```

### **Browser Performance Tools**
```bash
# Chrome DevTools Performance tab
# 1. Open DevTools (F12)
# 2. Go to Performance tab
# 3. Click Record
# 4. Interact with slow features
# 5. Stop recording and analyze

# Look for:
# - Long tasks (> 50ms)
# - Layout thrashing
# - Excessive garbage collection
# - Main thread blocking
```

### **React DevTools Profiler**
```bash
# React DevTools Profiler
# 1. Install React Developer Tools extension
# 2. Open React DevTools
# 3. Go to Profiler tab
# 4. Record interactions
# 5. Analyze render performance

# Key metrics:
# - Render duration
# - Number of renders
# - Props that changed
# - Component tree depth
```

---

## 📊 Performance Benchmarks

### **Target Performance Metrics**
```bash
# Database Performance
- Simple queries: < 50ms
- Complex queries: < 200ms
- Database functions: < 100ms

# Frontend Performance
- Component renders: < 16ms (60fps)
- API responses: < 500ms
- Page loads: < 2 seconds

# Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
```

### **Performance Testing**
```typescript
// Automated performance testing
describe('Performance Tests', () => {
  test('Lists page loads within 2 seconds', async () => {
    const start = performance.now()
    await render(<ListsPage />)
    const end = performance.now()
    
    expect(end - start).toBeLessThan(2000)
  })
  
  test('Search filters within 100ms', async () => {
    const lists = generateMockLists(1000)
    const start = performance.now()
    const filtered = filterLists(lists, 'search term')
    const end = performance.now()
    
    expect(end - start).toBeLessThan(100)
  })
})
```

---

## 📋 Performance Optimization Checklist

### **Database Optimization**
- [ ] Strategic indexes for common queries
- [ ] Database functions for complex operations
- [ ] Query performance monitoring
- [ ] Regular VACUUM and ANALYZE
- [ ] Connection pooling configured

### **Frontend Optimization**
- [ ] React.memo for expensive components
- [ ] useMemo for expensive calculations
- [ ] useCallback for event handlers
- [ ] Proper dependency arrays
- [ ] No object/array recreation in render

### **Network Optimization**
- [ ] API response caching
- [ ] Parallel requests where possible
- [ ] Request deduplication
- [ ] Proper loading states
- [ ] Error boundaries

### **Memory Management**
- [ ] Event listeners cleaned up
- [ ] Subscriptions unsubscribed
- [ ] Timers cleared
- [ ] No circular references
- [ ] Proper component unmounting

---

## 🔗 Related Documentation

### **Performance Documentation**
- **[Performance Overview](../performance/README.md)** - Current performance status and monitoring
- **[Performance Monitoring](../performance/monitoring.md)** - Monitoring tools and setup
- **[Performance Utilities](../performance/utilities.md)** - Custom performance monitoring tools

### **Optimization Guides**
- **[Component Optimization](../components/optimization.md)** - React component performance patterns
- **[Database Performance](../database/performance.md)** - Database optimization strategies
- **[Performance Evolution](../history/performance-evolution.md)** - Performance improvement journey

### **Related Issues**
- **[Database Troubleshooting](./database.md)** - Database-specific performance issues
- **[Deployment Troubleshooting](./deployment.md)** - Production performance issues

---

## 🆘 When to Escalate

### **Level 1: Quick Optimization (15-30 minutes)**
1. Check for obvious performance issues (infinite loops, missing indexes)
2. Use browser DevTools to identify bottlenecks
3. Apply common optimizations (React.memo, useMemo)
4. Test with performance monitoring utility

### **Level 2: Detailed Analysis (1-3 hours)**
1. Use React DevTools Profiler for detailed component analysis
2. Analyze database query performance with EXPLAIN
3. Check for memory leaks with browser tools
4. Implement targeted optimizations

### **Level 3: Advanced Optimization (1+ days)**
1. Consider architectural changes for performance
2. Implement advanced caching strategies
3. Optimize bundle size and loading strategies
4. Consider database schema optimizations

### **Level 4: Expert Consultation**
1. **Performance Consultant** - For complex performance issues
2. **Database Expert** - For advanced query optimization
3. **React Expert** - For complex component performance issues
4. **Infrastructure Expert** - For scaling and deployment optimization

---

*⚡ Performance optimization is an iterative process. Always measure before and after optimizations to ensure they provide real benefits.*

*Last Updated: June 10, 2025* 