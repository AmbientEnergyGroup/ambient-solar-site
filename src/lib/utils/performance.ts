// Performance optimization utilities

// Debounce function to limit function calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function to limit function calls
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Optimized localStorage operations
export class OptimizedStorage {
  private static cache = new Map<string, any>();
  private static pendingWrites = new Map<string, any>();
  private static writeTimeout: NodeJS.Timeout | null = null;

  static get(key: string): any {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        const parsed = JSON.parse(value);
        this.cache.set(key, parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return null;
  }

  static set(key: string, value: any): void {
    // Update cache immediately
    this.cache.set(key, value);
    this.pendingWrites.set(key, value);

    // Debounce writes to avoid blocking
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }

    this.writeTimeout = setTimeout(() => {
      this.flushWrites();
    }, 100);
  }

  private static flushWrites(): void {
    try {
      this.pendingWrites.forEach((value, key) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      this.pendingWrites.clear();
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  static remove(key: string): void {
    this.cache.delete(key);
    this.pendingWrites.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  static clear(): void {
    this.cache.clear();
    this.pendingWrites.clear();
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  static mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  static measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (start && end) {
      const duration = end - start;
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }

  static clearMarks(): void {
    this.marks.clear();
  }
}

// Lazy loading utility
export const lazyLoad = <T>(
  importFn: () => Promise<T>,
  fallback?: React.ReactNode
) => {
  let component: T | null = null;
  let loading = false;
  let error: Error | null = null;

  return {
    load: async (): Promise<T> => {
      if (component) return component;
      if (loading) {
        // Wait for current load to complete
        while (loading) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        if (error) throw error;
        return component!;
      }

      loading = true;
      error = null;

      try {
        component = await importFn();
        return component;
      } catch (err) {
        error = err as Error;
        throw error;
      } finally {
        loading = false;
      }
    },
    getComponent: () => component,
    isLoading: () => loading,
    getError: () => error,
  };
};

// Intersection Observer utility for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  if (typeof window === 'undefined') return null;

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
};

// Resource preloading utility
export const preloadResource = (href: string, as: string): void => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Batch DOM operations
export const batchDOMOperations = (operations: (() => void)[]): void => {
  if (typeof window === 'undefined') return;

  // Use requestAnimationFrame for smooth batching
  requestAnimationFrame(() => {
    operations.forEach(operation => {
      try {
        operation();
      } catch (error) {
        console.error('Error in batched DOM operation:', error);
      }
    });
  });
}; 