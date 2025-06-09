'use client';

import { useAuth } from '@/hooks/useAuth';

export default function AuthDebug() {
  const { user, loading, error, supabaseUser } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm text-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>User: {user ? `${user.email} (${user.id})` : 'null'}</div>
        <div>Supabase User: {supabaseUser ? `${supabaseUser.email}` : 'null'}</div>
        <div>Error: {error ? error.message : 'null'}</div>
        <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</div>
        <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
        <div>Timestamp: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
} 