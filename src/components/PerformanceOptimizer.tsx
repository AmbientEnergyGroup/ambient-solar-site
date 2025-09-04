"use client";

import { useEffect, useCallback } from 'react';

export default function PerformanceOptimizer() {
  // Optimize localStorage operations
  const optimizeLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Batch localStorage operations
    const batchOperations = () => {
      const operations: (() => void)[] = [];
      
      // Defer localStorage reads
      const deferredRead = (key: string) => {
        return new Promise<string | null>((resolve) => {
          operations.push(() => {
            try {
              resolve(localStorage.getItem(key));
            } catch (error) {
              console.error('Error reading from localStorage:', error);
              resolve(null);
            }
          });
        });
      };

      // Defer localStorage writes
      const deferredWrite = (key: string, value: string) => {
        operations.push(() => {
          try {
            localStorage.setItem(key, value);
          } catch (error) {
            console.error('Error writing to localStorage:', error);
          }
        });
      };

      // Execute operations in batches
      const executeBatch = () => {
        if (operations.length > 0) {
          const batch = operations.splice(0, 10); // Process 10 at a time
          batch.forEach(op => op());
          
          if (operations.length > 0) {
            requestIdleCallback(executeBatch);
          }
        }
      };

      return { deferredRead, deferredWrite, executeBatch };
    };

    return batchOperations();
  }, []);

  // Optimize image loading
  const optimizeImages = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Lazy load images
    const lazyLoadImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    };

    // Preload critical images
    const preloadCriticalImages = () => {
      const criticalImages = [
        '/images/ambient-logo.jpeg',
        '/images/ambient-logo-teal.jpeg'
      ];

      criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });
    };

    return { lazyLoadImages, preloadCriticalImages };
  }, []);

  // Optimize component loading
  const optimizeComponentLoading = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Prefetch critical routes
    const prefetchRoutes = () => {
      const criticalRoutes = ['/dashboard', '/canvassing', '/sets'];
      
      criticalRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    };

    // Defer non-critical operations
    const deferOperations = (operations: (() => void)[]) => {
      if ('requestIdleCallback' in window) {
        operations.forEach(op => requestIdleCallback(op));
      } else {
        operations.forEach(op => setTimeout(op, 0));
      }
    };

    return { prefetchRoutes, deferOperations };
  }, []);

  useEffect(() => {
    // Initialize optimizations after component mounts
    const timer = setTimeout(() => {
      optimizeLocalStorage();
      optimizeImages();
      optimizeComponentLoading();
    }, 100);

    return () => clearTimeout(timer);
  }, [optimizeLocalStorage, optimizeImages, optimizeComponentLoading]);

  // Monitor performance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let observer: PerformanceObserver | null = null;
    let navigationObserver: PerformanceObserver | null = null;

    // Monitor long tasks (only in development)
    if (process.env.NODE_ENV === 'development') {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('Long task detected:', entry);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      // Monitor navigation timing
      navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Navigation timing:', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              total: navEntry.loadEventEnd - navEntry.fetchStart
            });
          }
        }
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
    }

    return () => {
      if (observer) observer.disconnect();
      if (navigationObserver) navigationObserver.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
} 