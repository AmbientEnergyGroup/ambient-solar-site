"use client";

import { useEffect, useState } from 'react';

interface LoadingOptimizerProps {
  children: React.ReactNode;
}

export default function LoadingOptimizer({ children }: LoadingOptimizerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Show content after a short delay to prevent flash
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-primary">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-black"></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
