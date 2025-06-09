'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initMixpanel, trackPageView, updateDomainProperties } from '@/lib/mixpanelClient';

interface MixpanelProviderProps {
  children: React.ReactNode;
}

export default function MixpanelProvider({ children }: MixpanelProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Mixpanel on mount
    initMixpanel();
    
    // Update domain properties after initialization
    setTimeout(() => {
      updateDomainProperties();
    }, 100);
  }, []);

  useEffect(() => {
    // Track page views when pathname changes
    // Note: We handle page views manually (not using Mixpanel's automatic tracking)
    // to have better control over Next.js routing and avoid duplicates
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
} 