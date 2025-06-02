/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['maps.googleapis.com', 'lh3.googleusercontent.com'],
  },
  // Disable ESLint in production build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 