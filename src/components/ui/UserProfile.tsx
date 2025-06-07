import Image from 'next/image';
import { useState } from 'react';
import { User } from '@/types';

interface UserProfileProps {
  user: User;
  showBio?: boolean;
  showSocialMedia?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Add cache busting to Firebase Storage URLs
const addCacheBuster = (url: string): string => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
};

export default function UserProfile({ 
  user, 
  showBio = false, 
  showSocialMedia = false, 
  size = 'md',
  className = '' 
}: UserProfileProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-700 flex-shrink-0 relative`}>
        {user.photoURL && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border border-gray-500 border-t-transparent"></div>
              </div>
            )}
            <Image
              src={addCacheBuster(user.photoURL)}
              alt={user.displayName || 'User'}
              className="h-full w-full object-cover"
              width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
              height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onLoadStart={() => setImageLoading(true)}
            />
          </>
        ) : (
          <svg
            className="h-full w-full text-gray-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-white ${textSizeClasses[size]}`}>
          {user.displayName || 'Unknown User'}
        </div>
        
        {showBio && user.bio && (
          <p className="mt-1 text-sm text-gray-300 break-words">
            {user.bio}
          </p>
        )}
        
        {showSocialMedia && (user.instagram || user.tiktok) && (
          <div className="mt-2 flex items-center space-x-4">
            {user.instagram && (
              <a
                href={`https://instagram.com/${user.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs text-pink-400 hover:text-pink-300 transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                @{user.instagram}
              </a>
            )}
            
            {user.tiktok && (
              <a
                href={`https://tiktok.com/@${user.tiktok}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs text-gray-300 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                @{user.tiktok}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 