/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'maps.googleapis.com', 
      'lh3.googleusercontent.com',
      'tbabdwdhostkadpwwbhy.supabase.co' // Supabase storage domain
    ],
  },
  // Disable ESLint in production build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Comprehensive cache control headers
  async headers() {
    return [
      // Prevent caching of HTML files (app shell)
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '.*text/html.*',
          },
        ],
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          // Mobile browser specific headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      
      // Prevent caching of JavaScript bundles and chunks
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // Prevent caching of main JS files
      {
        source: '/_next/static/js/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // Prevent caching of CSS files
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // Allow caching of static assets with versioning (images, fonts, etc.)
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // Cache control for public static assets
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // 1 day
          },
        ],
      },
      
      // Cache control for other public assets
      {
        source: '/:path*\\.(png|jpg|jpeg|gif|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // 1 day
          },
        ],
      },
      
      // API routes - no caching for dynamic content
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          // CORS and security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      
      // Service Worker (if exists) - prevent caching
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // Workbox service worker files
      {
        source: '/workbox-:hash.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
        ],
      },
      
      // Manifest file - short cache
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600', // 1 hour
          },
        ],
      },
    ];
  },
  
  // Generate ETags for better cache validation
  generateEtags: true,
  
  // Compress responses
  compress: true,
  
  // Power off X-Powered-By header for security
  poweredByHeader: false,
  
  // Experimental features for better caching
  experimental: {
    // Enable static optimization
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig; 