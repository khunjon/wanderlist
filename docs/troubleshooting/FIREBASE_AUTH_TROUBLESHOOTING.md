# Firebase Auth 404 Troubleshooting Guide

## The Problem ✅ IDENTIFIED
You're getting a 404 error because of an **auth domain mismatch**:
- Your Firebase project auth domain: `wanderlist-69d86.firebaseapp.com`
- Your website domain: `placemarks.xyz`
- Your environment variable was set to: `placemarks.xyz`

## Quick Fix Applied ✅
I've already implemented a quick fix by switching from `signInWithRedirect` to `signInWithPopup` for Google authentication.

## 🚨 IMMEDIATE ACTION REQUIRED

**Update your Vercel environment variables:**

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` and change it to:
   ```
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = wanderlist-69d86.firebaseapp.com
   ```
3. Make sure it's set for **Production**, **Preview**, and **Development**
4. **Redeploy** your application

## Complete Environment Variables for Vercel

```env
# Firebase - Use these exact values
NEXT_PUBLIC_FIREBASE_API_KEY = your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = wanderlist-69d86.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = wanderlist-69d86
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID = your-app-id

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = your-google-maps-api-key

# App
NEXT_PUBLIC_APP_URL = https://placemarks.xyz
```

## Firebase Console Settings to Verify

1. **Go to Firebase Console** → Authentication → Settings → **Authorized domains**
2. **Make sure these domains are listed:**
   - `wanderlist-69d86.firebaseapp.com` (should be there by default)
   - `placemarks.xyz` (add this if not present)
   - `localhost` (for development)

## Google Cloud Console Settings

1. **Go to Google Cloud Console** → APIs & Services → **Credentials**
2. **Find your OAuth 2.0 client ID**
3. **Authorized JavaScript origins** should include:
   - `https://wanderlist-69d86.firebaseapp.com`
   - `https://placemarks.xyz`
4. **Authorized redirect URIs** should include:
   - `https://wanderlist-69d86.firebaseapp.com/__/auth/handler`
   - `https://placemarks.xyz/__/auth/handler`

## Why This Works

- **Popup method**: Doesn't require the auth handler URL on your domain
- **Correct auth domain**: Firebase knows how to handle authentication for `wanderlist-69d86.firebaseapp.com`
- **Cross-domain**: The popup can authenticate on Firebase's domain and return the result to your domain

## Testing the Fix

1. **Update Vercel environment variables** (most important!)
2. **Redeploy** your application
3. **Clear browser cache** and cookies
4. **Try Google sign-in** - should open popup and work correctly
5. **Check browser console** for any remaining errors

## Alternative: Custom Domain Setup (Advanced)

If you really want to use `placemarks.xyz` as your auth domain:

1. **Set up Firebase Hosting**:
   ```bash
   firebase init hosting
   firebase deploy --only hosting
   ```

2. **Add custom domain in Firebase Console**:
   - Go to Hosting → Add custom domain → `placemarks.xyz`
   - Follow DNS setup instructions

3. **Update auth domain** in Firebase project settings

But the simpler solution is to use Firebase's default auth domain with the popup method.

## Expected Result

After fixing the auth domain, your Google sign-in should work perfectly with a popup window, and you won't see any more 404 errors on auth handler URLs. 