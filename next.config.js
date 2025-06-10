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
};

module.exports = nextConfig; 