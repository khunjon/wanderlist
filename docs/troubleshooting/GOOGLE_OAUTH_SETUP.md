# Google OAuth Setup and Troubleshooting

## 🚨 Error: redirect_uri_mismatch

If you encounter this error when testing Google authentication:

```
Error 400: redirect_uri_mismatch
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.
```

This means the redirect URI isn't registered in your Google Cloud Console.

## 🔧 Step-by-Step Fix

### 1. **Configure Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs** (if you don't have one)
5. Choose **Web application**
6. Add these **Authorized redirect URIs**:

   **For Supabase:**
   ```
   https://tbabdwdhostkadpwwbhy.supabase.co/auth/v1/callback
   ```
   
   **For your production domain:**
   ```
   https://your-production-domain.com/auth/callback
   ```
   
   **For local development:**
   ```
   http://localhost:3000/auth/callback
   ```

7. Click **Save**
8. Copy the **Client ID** and **Client Secret**

### 2. **Configure Supabase Authentication**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Click on **Google**
5. Enable Google provider
6. Add your Google OAuth credentials:
   - **Client ID**: `your-google-client-id`
   - **Client Secret**: `your-google-client-secret`
7. The **Redirect URL** should automatically show: `https://tbabdwdhostkadpwwbhy.supabase.co/auth/v1/callback`
8. Click **Save**

### 3. **Verify Environment Variables**

Make sure your production deployment has these environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tbabdwdhostkadpwwbhy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (if needed for client-side)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Production URL
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### 4. **Test the OAuth Flow**

1. Deploy your changes
2. Go to your production site
3. Click "Sign in with Google"
4. You should be redirected to Google OAuth
5. After authorization, you'll be redirected back to your app

## 🔍 Common Issues and Solutions

### Issue: "Invalid redirect URI"
**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches what Supabase is sending.

### Issue: "OAuth client not found"
**Solution**: Verify the Client ID in Supabase matches the one from Google Cloud Console.

### Issue: "Access blocked"
**Solution**: Make sure your OAuth consent screen is configured and published.

### Issue: "Redirects to localhost instead of production domain"
**Problem**: After successful OAuth, user gets redirected to `http://localhost:3000` instead of your production domain.

**Solution**: Update your authentication code to use the production URL:

```typescript
// In src/lib/supabase/auth.ts
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
    },
  })
  // ... rest of function
}
```

**Environment Variable**: Make sure `NEXT_PUBLIC_APP_URL` is set in your production environment:
```bash
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

## 📋 OAuth Consent Screen Setup

If you haven't set up the OAuth consent screen:

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for public apps) or **Internal** (for organization apps)
3. Fill in required fields:
   - **App name**: Wanderlist
   - **User support email**: your-email@domain.com
   - **Developer contact information**: your-email@domain.com
4. Add scopes (usually just basic profile info)
5. Add test users if in development mode
6. Submit for verification if going public

## 🚀 Production Checklist

- [ ] Google Cloud Console OAuth client configured
- [ ] Redirect URIs added for production domain
- [ ] Supabase Google provider enabled and configured
- [ ] Environment variables set in production
- [ ] OAuth consent screen configured
- [ ] Test Google sign-in flow works

## 📖 Reference Links

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [OAuth Redirect URI Mismatch Errors](https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors-redirect-uri-mismatch)

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. Check the browser developer console for additional error messages
2. Verify the exact redirect URI being sent in the network tab
3. Ensure your domain is properly configured in both Google Cloud Console and Supabase
4. Try testing with a fresh incognito/private browser window 