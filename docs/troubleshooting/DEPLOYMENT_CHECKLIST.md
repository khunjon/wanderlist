# Production Deployment Checklist

## 🚀 Pre-Deployment Checklist

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- [ ] `NEXT_PUBLIC_APP_URL` - **CRITICAL**: Your production domain (e.g., `https://your-domain.com`)

### Google Cloud Console Configuration
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized redirect URIs configured:
  - [ ] `https://your-supabase-project.supabase.co/auth/v1/callback`
  - [ ] `https://your-production-domain.com/auth/callback`
- [ ] OAuth consent screen configured
- [ ] Google Maps APIs enabled (Places API, Maps JavaScript API)

### Supabase Configuration
- [ ] Google OAuth provider enabled
- [ ] Google Client ID and Secret configured
- [ ] Site URL set to your production domain
- [ ] Redirect URLs configured in Auth settings
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Storage bucket configured (if using profile photos)

## 🔧 Common Production Issues

### Issue: OAuth Redirects to Localhost
**Symptoms**: After Google OAuth, user gets redirected to `http://localhost:3000`

**Fix**: 
1. Set `NEXT_PUBLIC_APP_URL=https://your-production-domain.com` in production environment
2. Redeploy the application

### Issue: Google OAuth "redirect_uri_mismatch"
**Symptoms**: Error 400 when trying to sign in with Google

**Fix**: 
1. Add Supabase callback URL to Google Cloud Console OAuth settings
2. URL format: `https://your-project-id.supabase.co/auth/v1/callback`

### Issue: "Invalid API key" for Google Maps
**Symptoms**: Maps not loading or places search not working

**Fix**: 
1. Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly
2. Check API key restrictions in Google Cloud Console
3. Ensure Places API and Maps JavaScript API are enabled

## 📋 Post-Deployment Testing

### Authentication Flow
- [ ] Email/password sign up works
- [ ] Email/password sign in works
- [ ] Google OAuth sign in works
- [ ] Sign out works
- [ ] User profile creation works
- [ ] Profile photo upload works

### Core Functionality
- [ ] Create new list works
- [ ] Add places to list works
- [ ] Edit list works
- [ ] Delete list works
- [ ] Search places works
- [ ] View public lists works
- [ ] Map view works

### Performance
- [ ] Page load times acceptable
- [ ] Images load properly
- [ ] No console errors
- [ ] Mobile responsiveness works

## 🆘 Troubleshooting Commands

### Check Environment Variables
```bash
# In your deployment platform (Vercel, Netlify, etc.)
echo $NEXT_PUBLIC_APP_URL
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Test OAuth Flow
1. Open browser developer tools
2. Go to Network tab
3. Try Google sign in
4. Check redirect URLs in network requests

### Verify Supabase Connection
```javascript
// In browser console on your production site
console.log(window.location.origin)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

## 🔗 Quick Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard) (if using Vercel)
- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)

## 📞 Support

If you encounter issues not covered here:
1. Check the [troubleshooting directory](./README.md)
2. Review the [migration documentation](../migration/)
3. Verify all environment variables are set correctly
4. Test in incognito/private browser window to rule out cache issues 