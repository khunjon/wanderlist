'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to lists page
    router.push('/lists');
  }, [router]);

  // Return empty div while redirecting
  return <div className="min-h-screen bg-background"></div>;
} 