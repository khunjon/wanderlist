// Simple performance monitoring utilities
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  static endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(name);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    return fn().finally(() => {
      this.endTimer(name);
    });
  }

  static measure<T>(name: string, fn: () => T): T {
    this.startTimer(name);
    try {
      return fn();
    } finally {
      this.endTimer(name);
    }
  }
}

// Auth-specific performance tracking
export const AuthPerformance = {
  trackAuthRedirect: () => {
    PerformanceMonitor.startTimer('auth-redirect');
  },
  
  trackAuthComplete: () => {
    PerformanceMonitor.endTimer('auth-redirect');
  },
  
  trackListsLoad: () => {
    PerformanceMonitor.startTimer('lists-load');
  },
  
  trackListsComplete: () => {
    PerformanceMonitor.endTimer('lists-load');
  }
}; 