# 🔧 Performance Utilities & Tools

This document covers the performance utilities, tools, and helper functions available in Wanderlist for monitoring and optimizing performance during development and production.

## 📊 Custom Performance Monitoring Utility

### **Overview**
Wanderlist includes a custom performance monitoring utility (`src/lib/utils/performance.ts`) designed for development-time performance analysis and optimization.

### **Features**
- **Development-only monitoring** (zero production impact)
- **Component render timing** with React lifecycle tracking
- **API call performance** with status and response size tracking
- **Custom operation timing** for any performance-critical code
- **Console-based logging** with emoji indicators and thresholds
- **Session analytics** with summary reporting

### **Setup & Usage**

#### **Basic Import**
```typescript
import { perf } from '@/lib/utils/performance';
```

#### **Component Performance Monitoring**
```typescript
// Monitor component render performance
const MyComponent = React.memo(() => {
  const renderTimer = perf.component('MyComponent', 'render');
  
  renderTimer.start();
  
  // Component logic here
  const expensiveCalculation = useMemo(() => {
    // Complex computation
    return computeExpensiveValue();
  }, [dependencies]);
  
  useEffect(() => {
    renderTimer.end();
  });
  
  return <div>{/* Component JSX */}</div>;
});
```

#### **API Call Performance Monitoring**
```typescript
// Monitor API call performance
async function fetchUserLists() {
  const apiTimer = perf.api('GET', '/api/lists');
  
  apiTimer.start();
  
  try {
    const response = await fetch('/api/lists');
    const data = await response.json();
    
    // End timing with status and size
    apiTimer.end(
      response.status, 
      response.headers.get('content-length')
    );
    
    return data;
  } catch (error) {
    apiTimer.end(500); // Error status
    throw error;
  }
}
```

#### **Custom Operation Monitoring**
```typescript
// Monitor custom operations
function complexDataProcessing(data: any[]) {
  const operationTimer = perf.operation('dataProcessing', { 
    itemCount: data.length 
  });
  
  operationTimer.start();
  
  // Complex processing logic
  const processedData = data.map(item => {
    // Expensive transformation
    return transformItem(item);
  });
  
  operationTimer.end();
  
  return processedData;
}
```

### **Performance Thresholds & Indicators**

#### **API Call Performance**
```typescript
const apiThresholds = {
  "🚀": "< 100ms (Excellent)",
  "⚡": "< 500ms (Good)",
  "🟡": "< 1000ms (Acceptable)", 
  "🟠": "< 3000ms (Slow)",
  "🔴": "≥ 3000ms (Critical)"
};
```

#### **Component Render Performance**
```typescript
const componentThresholds = {
  "🚀": "< 16ms (60fps)",
  "⚡": "< 33ms (30fps)",
  "🟡": "< 50ms (20fps)",
  "🔴": "≥ 50ms (Critical)"
};
```

#### **Custom Operation Performance**
```typescript
const operationThresholds = {
  "🚀": "< 10ms (Excellent)",
  "⚡": "< 50ms (Good)",
  "🟡": "< 200ms (Acceptable)",
  "🔴": "≥ 200ms (Slow)"
};
```

### **Console Output Examples**

#### **Component Monitoring**
```bash
🚀 Component: ListsHeader (render) - 12.45ms { componentName: 'ListsHeader', phase: 'render' }
⚡ Component: ListsGrid (update) - 28.12ms { componentName: 'ListsGrid', phase: 'update' }
🔴 Component: ComplexChart (mount) - 67.89ms { componentName: 'ComplexChart', phase: 'mount' }
```

#### **API Call Monitoring**
```bash
🚀 API: GET /api/lists ✅ - 89.23ms { status: 200, size: '12.3KB' }
⚡ API: POST /api/lists/123/places 🟡 - 234.56ms { status: 201, size: '2.1KB' }
🟠 API: GET /api/places/search 🔴 - 2456.78ms { status: 500, size: undefined }
```

#### **Custom Operation Monitoring**
```bash
🚀 Operation: dataProcessing - 8.45ms { itemCount: 150 }
⚡ Operation: imageOptimization - 45.67ms { imageCount: 5, totalSize: '2.5MB' }
🟡 Operation: complexCalculation - 156.78ms { iterations: 10000 }
```

### **Session Analytics**

#### **Session Summary**
```typescript
// Get performance summary for current session
const summary = perf.getSessionSummary();

console.log('📊 Performance Session Summary:', {
  totalMetrics: summary.totalMetrics,
  averageApiTime: `${summary.averageApiTime.toFixed(2)}ms`,
  averageComponentTime: `${summary.averageComponentTime.toFixed(2)}ms`,
  apiCallCount: summary.apiCallCount,
  componentRenderCount: summary.componentRenderCount,
  slowestOperations: summary.slowestOperations.slice(0, 5)
});
```

#### **Automatic Session Logging**
```typescript
// Log session summary (called automatically on page unload)
perf.logSessionSummary();

// Output:
// 📊 Session Performance Summary
// Total Metrics: 45
// API Calls: 12 (avg: 156.78ms)
// Component Renders: 28 (avg: 23.45ms)
// Custom Operations: 5 (avg: 67.89ms)
// 
// 🐌 Slowest Operations:
// 1. API: GET /api/places/search - 2456.78ms
// 2. Component: ComplexChart (mount) - 67.89ms
// 3. Operation: complexCalculation - 156.78ms
```

## 🛠️ Development Tools Integration

### **React DevTools Profiler**

#### **Setup**
```bash
# Install React DevTools browser extension
# Available for Chrome, Firefox, Edge
```

#### **Usage with Performance Utility**
```typescript
// Enhanced component profiling
const ProfiledComponent = React.memo(() => {
  const renderTimer = perf.component('ProfiledComponent', 'render');
  
  // Use React DevTools Profiler API
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderTimer.start();
      
      // Component logic
      
      renderTimer.end();
    }
  });
  
  return <div>{/* Component content */}</div>;
});
```

### **Chrome DevTools Performance**

#### **Performance Recording**
```typescript
// Mark performance events for Chrome DevTools
function markPerformanceEvent(name: string, detail?: any) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
    
    if (detail && performance.measure) {
      performance.measure(`${name}-measure`, name);
    }
  }
}

// Usage in components
useEffect(() => {
  markPerformanceEvent('ListsPage-mount');
  
  return () => {
    markPerformanceEvent('ListsPage-unmount');
  };
}, []);
```

### **Bundle Analysis Tools**

#### **Webpack Bundle Analyzer**
```bash
# Analyze bundle size and composition
npm run build
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

#### **Next.js Bundle Analysis**
```bash
# Built-in Next.js bundle analysis
ANALYZE=true npm run build
```

## 📈 Performance Measurement Patterns

### **Component Optimization Workflow**

#### **1. Baseline Measurement**
```typescript
// Before optimization
const UnoptimizedComponent = () => {
  const timer = perf.component('UnoptimizedComponent', 'render');
  timer.start();
  
  // Unoptimized logic
  const expensiveValue = expensiveCalculation(); // No memoization
  
  timer.end();
  return <div>{expensiveValue}</div>;
};
```

#### **2. Apply Optimization**
```typescript
// After optimization
const OptimizedComponent = React.memo(() => {
  const timer = perf.component('OptimizedComponent', 'render');
  timer.start();
  
  // Optimized logic
  const expensiveValue = useMemo(() => expensiveCalculation(), [deps]);
  
  timer.end();
  return <div>{expensiveValue}</div>;
});
```

#### **3. Compare Results**
```bash
# Before: 🔴 Component: UnoptimizedComponent (render) - 67.89ms
# After:  🚀 Component: OptimizedComponent (render) - 12.45ms
# Improvement: 81.7% faster
```

### **API Performance Optimization**

#### **1. Baseline API Call**
```typescript
// Unoptimized API call
async function fetchData() {
  const timer = perf.api('GET', '/api/data');
  timer.start();
  
  const response = await fetch('/api/data');
  const data = await response.json();
  
  timer.end(response.status);
  return data;
}
```

#### **2. Add Caching**
```typescript
// Optimized with caching
const cache = new Map();

async function fetchDataCached() {
  const timer = perf.api('GET', '/api/data');
  timer.start();
  
  const cacheKey = '/api/data';
  if (cache.has(cacheKey)) {
    timer.end(200); // Cache hit
    return cache.get(cacheKey);
  }
  
  const response = await fetch('/api/data');
  const data = await response.json();
  cache.set(cacheKey, data);
  
  timer.end(response.status);
  return data;
}
```

## 🎯 Performance Testing Strategies

### **Load Testing with Performance Monitoring**

#### **Simulated Load Testing**
```typescript
// Test component performance under load
async function loadTestComponent() {
  const results = [];
  
  for (let i = 0; i < 100; i++) {
    const timer = perf.component('LoadTestComponent', 'render');
    timer.start();
    
    // Simulate component render
    await simulateComponentRender();
    
    const duration = timer.end();
    results.push(duration);
  }
  
  const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
  console.log(`📊 Load Test Results: ${avgTime.toFixed(2)}ms average`);
}
```

### **Memory Usage Monitoring**

#### **Memory Performance Tracking**
```typescript
// Monitor memory usage during operations
function trackMemoryUsage(operationName: string) {
  if (performance.memory) {
    const before = performance.memory.usedJSHeapSize;
    
    return {
      end: () => {
        const after = performance.memory.usedJSHeapSize;
        const diff = after - before;
        console.log(`🧠 Memory: ${operationName} - ${(diff / 1024 / 1024).toFixed(2)}MB`);
      }
    };
  }
  
  return { end: () => {} };
}

// Usage
const memoryTracker = trackMemoryUsage('dataProcessing');
// ... perform operation
memoryTracker.end();
```

## 🔧 Production Performance Monitoring

### **Error Boundary with Performance Tracking**

#### **Performance-Aware Error Boundary**
```typescript
class PerformanceErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track performance impact of errors
    perf.operation('errorBoundary', {
      error: error.message,
      componentStack: errorInfo.componentStack
    }).start().end();
    
    // Log error with performance context
    console.error('🚨 Performance Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### **Real User Monitoring (RUM) Integration**

#### **Custom RUM Metrics**
```typescript
// Send performance metrics to analytics
function sendPerformanceMetrics() {
  const summary = perf.getSessionSummary();
  
  // Send to analytics service
  analytics.track('performance_session', {
    averageApiTime: summary.averageApiTime,
    averageComponentTime: summary.averageComponentTime,
    totalMetrics: summary.totalMetrics,
    slowestOperations: summary.slowestOperations.slice(0, 3)
  });
}
```

## 🔗 Related Documentation

- **[Performance Baseline](./PERFORMANCE_BASELINE.md)** - Comprehensive performance analysis
- **[Performance Monitoring](./monitoring.md)** - Monitoring tools and dashboards
- **[Component Optimization](../components/optimization.md)** - React performance patterns
- **[Database Performance](../database/performance.md)** - Database optimization strategies

---

*🔧 Performance utilities are continuously improved based on development needs and optimization opportunities.* 