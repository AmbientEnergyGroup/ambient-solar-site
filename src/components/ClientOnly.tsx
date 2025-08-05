'use client';

import { useState, useEffect } from 'react';

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  // Wait for client-side hydration to complete
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  // Don't render anything until client-side hydration is done
  if (!hasMounted) {
    // Return null instead of a div to avoid any DOM structure mismatch
    return null;
  }
  
  return <>{children}</>;
} 