// Performance monitoring utility for development
// Tracks component render times, API calls, and other performance metrics

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  type: 'component' | 'api' | 'custom'
  metadata?: Record<string, any>
}

interface ApiCallMetric extends PerformanceMetric {
  type: 'api'
  url: string
  method: string
  status?: number
  size?: number
}

interface ComponentMetric extends PerformanceMetric {
  type: 'component'
  componentName: string
  phase: 'mount' | 'update' | 'unmount'
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private isEnabled: boolean
  private sessionMetrics: PerformanceMetric[] = []

  constructor() {
    // Only enable in development
    this.isEnabled = process.env.NODE_ENV === 'development'
  }

  /**
   * Start timing a performance metric
   */
  startTiming(name: string, type: 'component' | 'api' | 'custom', metadata?: Record<string, any>): string {
    if (!this.isEnabled) return name

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      type,
      metadata
    }

    this.metrics.set(name, metric)
    return name
  }

  /**
   * End timing and log the result
   */
  endTiming(name: string, additionalMetadata?: Record<string, any>): number | null {
    if (!this.isEnabled) return null

    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`⚠️ Performance: No start time found for "${name}"`)
      return null
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime

    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata }
    }

    // Log to console
    this.logMetric(metric)

    // Store in session metrics
    this.sessionMetrics.push({ ...metric })

    // Clean up
    this.metrics.delete(name)

    return metric.duration
  }

  /**
   * Time a component render
   */
  timeComponent(componentName: string, phase: 'mount' | 'update' | 'unmount' = 'mount'): {
    start: () => string
    end: () => number | null
  } {
    const timingName = `${componentName}-${phase}-${Date.now()}`
    
    return {
      start: () => this.startTiming(timingName, 'component', { componentName, phase }),
      end: () => this.endTiming(timingName)
    }
  }

  /**
   * Time an API call
   */
  timeApiCall(url: string, method: string = 'GET'): {
    start: () => string
    end: (status?: number, size?: number) => number | null
  } {
    const timingName = `api-${method}-${url}-${Date.now()}`
    
    return {
      start: () => this.startTiming(timingName, 'api', { url, method }),
      end: (status?: number, size?: number) => this.endTiming(timingName, { status, size })
    }
  }

  /**
   * Time a custom operation
   */
  timeOperation(operationName: string, metadata?: Record<string, any>): {
    start: () => string
    end: () => number | null
  } {
    const timingName = `${operationName}-${Date.now()}`
    
    return {
      start: () => this.startTiming(timingName, 'custom', metadata),
      end: () => this.endTiming(timingName)
    }
  }

  /**
   * Log a metric to console with appropriate formatting
   */
  private logMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled || !metric.duration) return

    const duration = metric.duration.toFixed(2)
    const emoji = this.getPerformanceEmoji(metric.duration, metric.type)
    
    switch (metric.type) {
      case 'component':
        const componentMetric = metric as ComponentMetric
        console.log(
          `${emoji} Component: ${componentMetric.componentName} (${componentMetric.phase}) - ${duration}ms`,
          metric.metadata
        )
        break
        
      case 'api':
        const apiMetric = metric as ApiCallMetric
        const statusEmoji = this.getStatusEmoji(apiMetric.status)
        console.log(
          `${emoji} API: ${apiMetric.method} ${apiMetric.url} ${statusEmoji} - ${duration}ms`,
          { 
            status: apiMetric.status, 
            size: apiMetric.size ? `${(apiMetric.size / 1024).toFixed(1)}KB` : undefined,
            ...metric.metadata 
          }
        )
        break
        
      case 'custom':
        console.log(
          `${emoji} Operation: ${metric.name} - ${duration}ms`,
          metric.metadata
        )
        break
    }
  }

  /**
   * Get emoji based on performance timing
   */
  private getPerformanceEmoji(duration: number, type: string): string {
    if (type === 'api') {
      if (duration < 100) return '🚀' // Very fast
      if (duration < 500) return '⚡' // Fast
      if (duration < 1000) return '🟡' // Moderate
      if (duration < 3000) return '🟠' // Slow
      return '🔴' // Very slow
    }
    
    if (type === 'component') {
      if (duration < 16) return '🚀' // 60fps
      if (duration < 33) return '⚡' // 30fps
      if (duration < 50) return '🟡' // 20fps
      return '🔴' // Slow render
    }
    
    // Custom operations
    if (duration < 10) return '🚀'
    if (duration < 50) return '⚡'
    if (duration < 200) return '🟡'
    return '🔴'
  }

  /**
   * Get emoji for HTTP status codes
   */
  private getStatusEmoji(status?: number): string {
    if (!status) return ''
    if (status >= 200 && status < 300) return '✅'
    if (status >= 300 && status < 400) return '↩️'
    if (status >= 400 && status < 500) return '❌'
    if (status >= 500) return '💥'
    return '❓'
  }

  /**
   * Get performance summary for the current session
   */
  getSessionSummary(): {
    totalMetrics: number
    averageApiTime: number
    averageComponentTime: number
    slowestOperations: PerformanceMetric[]
    apiCallCount: number
    componentRenderCount: number
  } {
    if (!this.isEnabled) {
      return {
        totalMetrics: 0,
        averageApiTime: 0,
        averageComponentTime: 0,
        slowestOperations: [],
        apiCallCount: 0,
        componentRenderCount: 0
      }
    }

    const apiMetrics = this.sessionMetrics.filter(m => m.type === 'api')
    const componentMetrics = this.sessionMetrics.filter(m => m.type === 'component')
    
    const averageApiTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / apiMetrics.length
      : 0
      
    const averageComponentTime = componentMetrics.length > 0
      ? componentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / componentMetrics.length
      : 0

    const slowestOperations = [...this.sessionMetrics]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10)

    return {
      totalMetrics: this.sessionMetrics.length,
      averageApiTime: Number(averageApiTime.toFixed(2)),
      averageComponentTime: Number(averageComponentTime.toFixed(2)),
      slowestOperations,
      apiCallCount: apiMetrics.length,
      componentRenderCount: componentMetrics.length
    }
  }

  /**
   * Log session summary to console
   */
  logSessionSummary(): void {
    if (!this.isEnabled) return

    const summary = this.getSessionSummary()
    
    console.group('📊 Performance Session Summary')
    console.log(`Total Operations: ${summary.totalMetrics}`)
    console.log(`API Calls: ${summary.apiCallCount} (avg: ${summary.averageApiTime}ms)`)
    console.log(`Component Renders: ${summary.componentRenderCount} (avg: ${summary.averageComponentTime}ms)`)
    
    if (summary.slowestOperations.length > 0) {
      console.log('\n🐌 Slowest Operations:')
      summary.slowestOperations.forEach((op, index) => {
        console.log(`${index + 1}. ${op.name} - ${op.duration?.toFixed(2)}ms (${op.type})`)
      })
    }
    console.groupEnd()
  }

  /**
   * Clear session metrics
   */
  clearSession(): void {
    this.sessionMetrics = []
    this.metrics.clear()
  }

  /**
   * Check if monitoring is enabled
   */
  get enabled(): boolean {
    return this.isEnabled
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor()

// Export convenience functions
export const perf = {
  /**
   * Time a component render
   * Usage: const timer = perf.component('MyComponent', 'mount'); timer.start(); ... timer.end();
   */
  component: (name: string, phase: 'mount' | 'update' | 'unmount' = 'mount') => 
    performanceMonitor.timeComponent(name, phase),

  /**
   * Time an API call
   * Usage: const timer = perf.api('/api/lists', 'GET'); timer.start(); ... timer.end(200, 1024);
   */
  api: (url: string, method: string = 'GET') => 
    performanceMonitor.timeApiCall(url, method),

  /**
   * Time a custom operation
   * Usage: const timer = perf.operation('dataProcessing'); timer.start(); ... timer.end();
   */
  operation: (name: string, metadata?: Record<string, any>) => 
    performanceMonitor.timeOperation(name, metadata),

  /**
   * Get session performance summary
   */
  summary: () => performanceMonitor.getSessionSummary(),

  /**
   * Log session summary to console
   */
  logSummary: () => performanceMonitor.logSessionSummary(),

  /**
   * Clear session metrics
   */
  clear: () => performanceMonitor.clearSession(),

  /**
   * Check if monitoring is enabled
   */
  enabled: performanceMonitor.enabled
}

// Export the monitor instance for advanced usage
export { performanceMonitor }

// Export types for TypeScript users
export type { PerformanceMetric, ApiCallMetric, ComponentMetric } 