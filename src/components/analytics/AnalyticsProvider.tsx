'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, pageview } from '@/lib/analytics/gtag';

interface AnalyticsProviderProps {
  children: ReactNode;
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize Google Analytics
    initGA();
  }, []);

  useEffect(() => {
    // Track page views when the route changes
    if (pathname) {
      const url = searchParams?.size 
        ? `${pathname}?${searchParams}`
        : pathname;
      
      pageview(url);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
} 