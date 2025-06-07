# Firebase Auth 404 Troubleshooting Guide

## The Problem
You're getting a 404 error on the Firebase Auth handler URL: `https://placemarks.xyz/__/auth/handler`

This happens when there's a mismatch between your Firebase project configuration and your domain setup.

## Quick Fix Applied ✅
I've already implemented a quick fix by switching from `signInWithRedirect` to `signInWithPopup` for Google authentication. This should resolve the immediate issue.

**Changes made:**
- Modified `src/lib/firebase/auth.ts` to use popup instead of redirect
- Updated `src/hooks/useAuth.tsx` to remove redirect result handling
- Added a debug component to help verify your Firebase configuration

## Verify the Fix

1. **Check the debug component**: Look for a small debug panel in the bottom-right corner of your app (only visible in development)
2. **Test Google sign-in**: Try signing in with Google - it should now open a popup instead of redirecting
3. **Check for errors**: Look in the browser console for any authentication errors

## If You Still Have Issues

### 1. Verify Your Environment Variables

Make sure you have a `.env.local` file in your project root with:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# App
NEXT_PUBLIC_APP_URL=https://placemarks.xyz
```

### 2. Check Firebase Console Settings

1. **Go to Firebase Console** → Your Project → Authentication → Settings
2. **Authorized domains**: Make sure `placemarks.xyz` is listed
3. **Auth domain**: Should match what's in your `.env.local`

### 3. Verify Google Cloud Console

1. **Go to Google Cloud Console** → Your Project → APIs & Services → Credentials
2. **Find your OAuth 2.0 client ID** for web application
3. **Authorized JavaScript origins**: Should include `https://placemarks.xyz`
4. **Authorized redirect URIs**: Should include `https://placemarks.xyz/__/auth/handler` (if using redirect method)

### 4. If Using Custom Domain with Firebase Hosting

If you want to use Firebase Hosting with your custom domain:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting (if not already done)
firebase init hosting

# Deploy
firebase deploy --only hosting

# Add custom domain in Firebase Console
# Go to Hosting → Add custom domain → placemarks.xyz
```

## Alternative Solutions

### Option 1: Use Firebase's Default Auth Domain
Change your `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` to use Firebase's default:
```env
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
```

### Option 2: Use Vercel with Firebase Auth
If you're hosting on Vercel (which you appear to be), the popup method should work perfectly. Just make sure:

1. Your Vercel environment variables match your `.env.local`
2. Your Firebase authorized domains include your Vercel domain
3. Your Google OAuth settings include your Vercel domain

## Testing the Fix

1. **Clear your browser cache** and cookies for your site
2. **Try signing in with Google** - should open a popup
3. **Check the debug component** for any configuration mismatches
4. **Look in browser console** for any remaining errors

## Debug Information

The debug component I added will show:
- Your Firebase API key (partially masked)
- Your auth domain
- Your project ID
- Current domain
- Warning if there's a domain mismatch

## Need More Help?

If you're still having issues:

1. **Check the debug component** output
2. **Share any console errors** you're seeing
3. **Verify your Firebase project settings** match your environment variables
4. **Test with a fresh incognito/private browser window**

The popup method should resolve the 404 error you were experiencing with the auth handler URL. 