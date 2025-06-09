import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const { code, error } = await searchParams

  if (error) {
    console.error('Auth callback error:', error)
    redirect('/auth/error?message=' + encodeURIComponent(error))
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      redirect('/auth/error?message=' + encodeURIComponent(exchangeError.message))
    }
  }

  // Redirect directly to lists page to avoid extra redirect hop
  redirect('/lists')
} 