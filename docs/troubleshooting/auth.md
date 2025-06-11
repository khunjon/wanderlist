# 🔐 Authentication Troubleshooting

This guide covers authentication issues including Google OAuth, Supabase Auth, session management, and JWT token problems.

## 🚨 Quick Fixes for Critical Auth Issues

### **🔥 Authentication Completely Broken**
```bash
# 1. Clear all authentication state
localStorage.clear()
sessionStorage.clear()

# 2. Check Supabase project status
# Go to Supabase Dashboard → Check if project is paused

# 3. Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Test with fresh incognito window
```

### **🔥 Google OAuth Not Working**
```bash
# 1. Check Google Cloud Console OAuth setup
# 2. Verify redirect URIs match exactly
# 3. Check Supabase Auth provider configuration
# 4. Test with different Google account
```

---

## 🔍 Common Authentication Issues

### **1. Google OAuth redirect_uri_mismatch**

#### **Error Message**
```
Error 400: redirect_uri_mismatch
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.
```

#### **Root Cause**
The redirect URI in your Google Cloud Console doesn't match what Supabase is sending.

#### **Solution**
1. **Go to Google Cloud Console** → APIs & Services → Credentials
2. **Find your OAuth 2.0 Client ID** and click edit
3. **Add these Authorized redirect URIs**:
   ```
   https://tbabdwdhostkadpwwbhy.supabase.co/auth/v1/callback
   https://your-production-domain.com/auth/callback
   http://localhost:3000/auth/callback
   ```
4. **Save changes** and wait 5-10 minutes for propagation

#### **Verification**
```bash
# Test the OAuth flow
# 1. Go to your app
# 2. Click "Sign in with Google"
# 3. Should redirect to Google OAuth
# 4. After authorization, should redirect back to your app
```

---

### **2. Supabase Auth Session Issues**

#### **Symptoms**
- User appears logged in but API calls fail with 401
- Session expires immediately after login
- User gets logged out randomly

#### **Debugging Steps**
```javascript
// Check current session in browser console
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)

// Check if JWT is valid
if (session?.access_token) {
  const payload = JSON.parse(atob(session.access_token.split('.')[1]))
  console.log('JWT payload:', payload)
  console.log('Expires at:', new Date(payload.exp * 1000))
}
```

#### **Common Causes & Solutions**

##### **JWT Token Expired**
```javascript
// Solution: Implement automatic token refresh
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  }
})
```

##### **RLS Policies Blocking Access**
```sql
-- Check if user can access their own data
SELECT auth.uid(); -- Should return user ID
SELECT * FROM users WHERE id = auth.uid(); -- Should return user data
```

##### **Environment Variable Issues**
```bash
# Verify Supabase configuration
echo "URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "Anon Key: $NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Check if keys match Supabase dashboard
```

---

### **3. Production vs Development Auth Issues**

#### **Symptoms**
- Auth works locally but fails in production
- Redirects to localhost instead of production domain
- CORS errors in production

#### **Solution Checklist**
```bash
# 1. Environment Variables in Production
NEXT_PUBLIC_SUPABASE_URL=https://tbabdwdhostkadpwwbhy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# 2. Google Cloud Console Setup
# Add production domain to authorized redirect URIs

# 3. Supabase Auth Configuration
# Add production domain to allowed origins
```

#### **Update Auth Code for Production**
```typescript
// src/lib/supabase/auth.ts
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
    },
  })
  
  if (error) {
    console.error('Auth error:', error)
    throw error
  }
  
  return data
}
```

---

### **4. Session Persistence Issues**

#### **Symptoms**
- User gets logged out on page refresh
- Session doesn't persist across browser tabs
- Auth state resets randomly

#### **Debugging**
```javascript
// Check session storage
console.log('localStorage auth:', localStorage.getItem('sb-tbabdwdhostkadpwwbhy-auth-token'))
console.log('sessionStorage auth:', sessionStorage.getItem('sb-tbabdwdhostkadpwwbhy-auth-token'))

// Check Supabase client configuration
console.log('Supabase client config:', supabase.supabaseUrl, supabase.supabaseKey)
```

#### **Solution**
```typescript
// Ensure proper Supabase client configuration
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)
```

---

## 🛠️ Advanced Debugging

### **Check Auth State in Components**
```typescript
// Use this hook to debug auth state
import { useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

export function useAuthDebug() {
  const supabase = useSupabaseClient()
  const user = useUser()
  
  useEffect(() => {
    console.log('Auth Debug:', {
      user,
      isLoggedIn: !!user,
      userId: user?.id,
      email: user?.email
    })
    
    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [user, supabase])
}
```

### **Test Auth API Directly**
```bash
# Test Supabase Auth API directly
curl -X POST 'https://tbabdwdhostkadpwwbhy.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword"
  }'
```

### **Check RLS Policies**
```sql
-- Test if RLS policies are working correctly
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-id-here", "email": "test@example.com"}';

-- Test user access
SELECT * FROM users WHERE id = 'user-id-here';
SELECT * FROM lists WHERE user_id = 'user-id-here';
```

---

## 📋 Authentication Checklist

### **Development Setup**
- [ ] Supabase project created and active
- [ ] Environment variables set in `.env.local`
- [ ] Google Cloud Console OAuth client configured
- [ ] Supabase Auth provider enabled
- [ ] Redirect URIs match exactly
- [ ] Auth callback page exists (`/auth/callback`)

### **Production Deployment**
- [ ] Environment variables set in production
- [ ] Production domain added to Google OAuth
- [ ] Production domain added to Supabase allowed origins
- [ ] HTTPS enabled and working
- [ ] Auth flow tested end-to-end

### **Debugging Tools**
- [ ] Browser console for auth errors
- [ ] Supabase dashboard auth logs
- [ ] Network tab for failed requests
- [ ] React DevTools for auth state

---

## 🔗 Related Documentation

### **Setup Guides**
- **[Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)** - Detailed Google OAuth configuration
- **[Supabase Configuration](../setup/supabase-configuration.md)** - Complete Supabase setup

### **Architecture**
- **[Security Model](../security/README.md)** - RLS policies and authentication patterns
- **[API Documentation](../api/auth.md)** - Authentication API endpoints

### **Legacy Issues**
- **[Firebase Auth Troubleshooting](./FIREBASE_AUTH_TROUBLESHOOTING.md)** - Legacy authentication issues (archived)

---

## 🆘 When to Escalate

### **Level 1: Try These First (5-15 minutes)**
1. Clear browser storage and test in incognito
2. Verify environment variables
3. Check Supabase project status
4. Test with different Google account

### **Level 2: Detailed Investigation (15-60 minutes)**
1. Check all logs (browser, Supabase, Vercel)
2. Test auth API directly
3. Verify RLS policies
4. Check production vs development differences

### **Level 3: External Support**
1. **Supabase Support** - For Supabase Auth issues
2. **Google Cloud Support** - For OAuth configuration issues
3. **Vercel Support** - For deployment-related auth issues

---

*🔐 Authentication issues can be complex due to the interaction between multiple services. Always start with the quick fixes and work through the debugging steps systematically.*

*Last Updated: June 10, 2025* 