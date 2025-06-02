'use client';

import { useEffect, ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, pageview } from '@/lib/analytics/gtag';

interface AnalyticsProviderProps {
  children: ReactNode;
}

// Separate component to handle search params
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page views when the route changes
    if (pathname) {
      const url = searchParams?.size 
        ? `${pathname}?${searchParams}`
        : pathname;
      
      pageview(url);
    }
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    // Initialize Google Analytics
    initGA();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  );
} 