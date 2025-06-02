// This is a static page for the special _not-found route
import Link from 'next/link';

export default function NotFoundSpecial() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center px-4 py-10 bg-gray-800 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-gray-300 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
} 