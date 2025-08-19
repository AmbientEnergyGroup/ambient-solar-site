"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function NavigationOptimizer() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Prefetch all main routes on mount
    const mainRoutes = [
      '/dashboard',
      '/canvassing', 
      '/messages',
      '/sets',
      '/projects',
      '/team',
      '/leaderboard',
      '/incentives',
      '/hr',
      '/schedule',
      '/manager-roles',
      '/developer',
      '/recruiting-form'
    ];

    // Prefetch routes in background
    mainRoutes.forEach(route => {
      if (route !== pathname) {
        router.prefetch(route);
      }
    });

    // Add performance monitoring
    if (typeof window !== 'undefined') {
      const navigationStart = performance.now();
      
      const handleRouteChange = () => {
        const navigationEnd = performance.now();
        const navigationTime = navigationEnd - navigationStart;
        
        // Log slow navigation for debugging
        if (navigationTime > 1000) {
          console.warn(`Slow navigation detected: ${navigationTime.toFixed(2)}ms`);
        }
      };

      // Monitor route changes
      window.addEventListener('popstate', handleRouteChange);
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [pathname, router]);

  return null; // This component doesn't render anything
} 