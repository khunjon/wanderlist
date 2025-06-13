'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from '@/types';
import { useAdmin } from '@/hooks/useAdmin';

interface UserMenuProps {
  user: User;
  onSignOut: () => Promise<void>;
}

export default function UserMenu({ user, onSignOut }: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin } = useAdmin();

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await onSignOut();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg p-1"
      >
        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-700 relative">
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.displayName || 'User'}
              className="h-full w-full object-cover"
              key={user.photo_url}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          {/* Default avatar fallback */}
          <div className={`absolute inset-0 flex items-center justify-center ${user.photo_url ? 'hidden' : ''}`}>
            <svg
              className="h-5 w-5 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
        <span className="hidden md:block text-sm font-medium">
          {user.displayName || user.email?.split('@')[0]}
        </span>
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
              <div className="font-medium">{user.displayName || 'User'}</div>
              <div className="text-xs text-gray-400">{user.email}</div>
            </div>
            
            <div className="py-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Your Profile
              </Link>
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-sm text-yellow-300 hover:bg-gray-700 hover:text-yellow-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 