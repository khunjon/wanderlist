'use client';

import { useState, useEffect, Suspense } from 'react';
import { signUp, signInWithGoogle } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';

function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user && !authLoading) {
      setError(null);
      setLoading(false);
      const redirectTo = searchParams.get('redirect') || '/lists';
      window.location.href = redirectTo;
    }
  }, [user, authLoading, searchParams]);

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
    } catch (err: any) {
      setError(err.message || 'Account creation failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed. Please try again.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="mt-4 text-gray-300">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
      <Card className="w-full max-w-md bg-gray-800 border border-gray-700 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">Create your account</CardTitle>
          <CardDescription className="text-center text-gray-300">
            Or{' '}
            <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
              log in to your account
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-200 bg-red-900/70 border border-red-700 rounded-md">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignup}
            disabled={loading}
            variant="outline"
            className="w-full bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FcGoogle className="h-4 w-4 mr-2" />
            )}
            Sign up with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleEmailSignup}>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                disabled={loading}
                required
                className="bg-gray-900 text-white border-gray-700 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="bg-gray-900 text-white border-gray-700 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="bg-gray-900 text-white border-gray-700 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className="bg-gray-900 text-white border-gray-700 placeholder:text-gray-400"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
} 