'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { List, MapPin, Compass, User } from 'lucide-react';

interface TabItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

const tabs: TabItem[] = [
  {
    name: 'Lists',
    href: '/lists',
    icon: List,
    requiresAuth: true,
  },
  {
    name: 'Near Me',
    href: '/near-me',
    icon: MapPin,
    requiresAuth: true,
  },
  {
    name: 'Discover',
    href: '/discover',
    icon: Compass,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    requiresAuth: true,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide on specific pages for focused experience
  const hideBottomNav = 
    pathname === '/lists/new' || 
    (pathname?.startsWith('/lists/') && pathname !== '/lists') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/admin') ||
    pathname === '/';
  
  // Don't show on desktop or on hidden pages
  if (hideBottomNav) {
    return null;
  }

  // Filter tabs based on authentication
  const visibleTabs = tabs.filter(tab => !tab.requiresAuth || user);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Safe area background for iOS */}
      <div className="bg-gray-900 pb-safe">
        <div className="bg-gray-900 border-t border-gray-700">
          <div className="flex">
            {visibleTabs.map((tab) => {
              const isActive = pathname === tab.href || 
                (tab.href === '/lists' && pathname?.startsWith('/lists') && pathname !== '/lists/new') ||
                (tab.href === '/near-me' && pathname?.startsWith('/near-me')) ||
                (tab.href === '/discover' && pathname?.startsWith('/discover')) ||
                (tab.href === '/profile' && pathname?.startsWith('/profile'));

              const Icon = tab.icon;

              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ease-in-out ${
                    isActive
                      ? 'text-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className={`relative transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}>
                    <Icon 
                      className={`h-6 w-6 transition-colors duration-200 ${
                        isActive ? 'text-blue-400' : 'text-gray-400'
                      }`} 
                    />
                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                    isActive ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    {tab.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 