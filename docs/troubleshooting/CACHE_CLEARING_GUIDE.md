# 🔧 Cache Clearing & Auth Domain Fix Guide

## 🚨 **CRITICAL: Do These Steps in Order**

### **1. Environment Variables (MUST DO FIRST)**

Update your `.env.local` file with the correct auth domain:

```env
# Firebase - CRITICAL: Use the correct auth domain
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wanderlist-69d86.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wanderlist-69d86
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **2. Clear All Development Caches**

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules cache (if needed)
npm cache clean --force

# Rebuild
npm run build
npm run dev
```

### **3. Clear Browser Caches (CRITICAL)**

**Chrome/Edge:**
1. Press `Ctrl+Shift+Delete` (`Cmd+Shift+Delete` on Mac)
2. Select "All time" as time range
3. Check ALL boxes:
   - ✅ Browsing history
   - ✅ Cookies and other site data
   - ✅ Cached images and files
   - ✅ Hosted app data
4. Click "Clear data"

**Firefox:**
1. Press `Ctrl+Shift+Delete` (`Cmd+Shift+Delete` on Mac)
2. Select "Everything" as time range
3. Check all boxes
4. Click "Clear Now"

**Alternative: Hard Refresh**
- `Ctrl+Shift+R` (`Cmd+Shift+R` on Mac)
- Or: F12 → Right-click refresh → "Empty Cache and Hard Reload"

### **4. Clear Firebase Auth Cache (Use Debug Tool)**

In development mode, you'll see a debug panel in the bottom-right corner:
1. Click "Clear Auth Cache" button
2. Wait for confirmation message
3. Refresh the page

### **5. Test Google Sign-in**

**Test in this order:**

1. **Incognito/Private Mode First**
   - Open incognito/private window
   - Go to your app
   - Try Google sign-in
   - This bypasses all caches

2. **Regular Browser**
   - After clearing caches
   - Try Google sign-in
   - Should open popup with account selection

### **6. Vercel Deployment (If Using Vercel)**

Update Vercel environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` to: `wanderlist-69d86.firebaseapp.com`
3. Set for Production, Preview, and Development
4. Redeploy your application

### **7. Firebase Console Verification**

**Authorized Domains:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. Ensure these are listed:
   - `wanderlist-69d86.firebaseapp.com` ✅
   - `placemarks.xyz` ✅
   - `localhost` ✅

**Google Cloud Console:**
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 client ID → Authorized JavaScript origins:
   - `https://wanderlist-69d86.firebaseapp.com` ✅
   - `https://placemarks.xyz` ✅
3. Authorized redirect URIs:
   - `https://wanderlist-69d86.firebaseapp.com/__/auth/handler` ✅
   - `https://placemarks.xyz/__/auth/handler` ✅

## 🔍 **Troubleshooting**

### **Common Issues & Solutions:**

**"Popup blocked" error:**
- Allow popups for your domain
- Try in incognito mode first

**"Unauthorized domain" error:**
- Check Firebase authorized domains
- Verify environment variables
- Clear all caches and try again

**Still getting 404 on auth handler:**
- Double-check auth domain in `.env.local`
- Restart development server
- Clear browser cache completely

**Google sign-in shows old account:**
- The new `prompt: 'select_account'` forces account selection
- Clear Google account cookies specifically

### **Debug Information**

The debug panel (development only) shows:
- Current auth domain configuration
- Project ID
- Cache clearing functionality

### **Expected Behavior After Fix:**

1. ✅ Google sign-in opens popup window
2. ✅ Shows account selection (not cached account)
3. ✅ Popup closes and user is signed in
4. ✅ No 404 errors in console
5. ✅ No auth handler URL errors

## 🚀 **Quick Test Commands**

```bash
# Full cache clear and restart
rm -rf .next && npm run dev

# Check environment variables
echo $NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN

# Force fresh build
npm run build && npm start
```

## ⚠️ **Important Notes**

- **Always test in incognito first** after making changes
- **The auth domain MUST be** `wanderlist-69d86.firebaseapp.com`
- **Popup method** is more reliable than redirect for custom domains
- **Account selection** is now forced to bypass cached credentials
- **Clear ALL caches** - browser, Next.js, and Firebase auth state

If you're still having issues after following all steps, the problem might be:
1. Environment variables not properly set
2. Browser cache not fully cleared
3. Firebase/Google Cloud configuration mismatch 