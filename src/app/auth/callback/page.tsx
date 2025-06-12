import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const { code, error } = await searchParams

  console.log('[AUTH CALLBACK] Processing callback with:', { hasCode: !!code, error })

  if (error) {
    console.error('[AUTH CALLBACK] OAuth error:', error)
    redirect('/auth/error?message=' + encodeURIComponent(error))
  }

  if (code) {
    const supabase = await createClient()
    console.log('[AUTH CALLBACK] Exchanging code for session...')
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[AUTH CALLBACK] Error exchanging code for session:', exchangeError)
      redirect('/auth/error?message=' + encodeURIComponent(exchangeError.message))
    }

    if (data.session) {
      console.log('[AUTH CALLBACK] Session established successfully for user:', data.session.user.id)
    }
  }

  console.log('[AUTH CALLBACK] Redirecting to /lists')
  // Redirect directly to lists page to avoid extra redirect hop
  redirect('/lists')
} 