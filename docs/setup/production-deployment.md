# 🚀 Production Deployment Guide

This guide covers deploying Wanderlist to production, including environment configuration, OAuth setup, and post-deployment testing.

## 📋 Pre-Deployment Checklist

### 🔑 Environment Variables
Ensure all required environment variables are configured in your production environment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps Integration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-production-domain.com  # CRITICAL for OAuth

# Optional: MCP Integration (for development)
SUPABASE_PERSONAL_ACCESS_TOKEN=your-personal-access-token
```

### 🔐 Google Cloud Console Configuration

#### 1. OAuth 2.0 Client Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   https://your-production-domain.com/auth/callback
   ```
7. Save and copy the **Client ID** and **Client Secret**

#### 2. OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for public apps) or **Internal** (for organization apps)
3. Fill in required fields:
   - **App name**: Wanderlist
   - **User support email**: your-email@domain.com
   - **Developer contact information**: your-email@domain.com
4. Add scopes (basic profile info)
5. Submit for verification if going public

#### 3. Enable Required APIs
- [ ] **Places API** - For place search functionality
- [ ] **Maps JavaScript API** - For map display
- [ ] **Geocoding API** - For address resolution

### 🗄️ Supabase Configuration

#### 1. Google OAuth Provider
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Enable **Google** provider
5. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
6. The **Redirect URL** will be: `https://your-project-id.supabase.co/auth/v1/callback`

#### 2. Site URL Configuration
1. Go to **Authentication** → **Settings**
2. Set **Site URL** to: `https://your-production-domain.com`
3. Add **Redirect URLs**:
   ```
   https://your-production-domain.com/auth/callback
   https://your-production-domain.com/**
   ```

#### 3. Database and Storage
- [ ] Database schema deployed
- [ ] Row Level Security (RLS) policies enabled
- [ ] Storage bucket configured (for profile photos)
- [ ] Database functions deployed

## 🚀 Deployment Process

### 1. **Vercel Deployment** (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

### 2. **Alternative Platforms**
- **Netlify**: Configure build settings and environment variables
- **Railway**: Deploy with automatic environment variable detection
- **DigitalOcean App Platform**: Configure app spec with environment variables

## 🔧 Common Production Issues & Solutions

### Issue: OAuth Redirects to Localhost
**Symptoms**: After Google OAuth, user gets redirected to `http://localhost:3000`

**Solution**: 
1. Set `NEXT_PUBLIC_APP_URL=https://your-production-domain.com` in production
2. Redeploy the application
3. Clear browser cache and test again

### Issue: Google OAuth "redirect_uri_mismatch"
**Symptoms**: Error 400 when trying to sign in with Google

**Solution**: 
1. Verify redirect URI in Google Cloud Console matches Supabase callback URL
2. URL format: `https://your-project-id.supabase.co/auth/v1/callback`
3. Ensure production domain is also added as authorized redirect URI

### Issue: "Invalid API key" for Google Maps
**Symptoms**: Maps not loading or places search not working

**Solution**: 
1. Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set correctly
2. Check API key restrictions in Google Cloud Console
3. Ensure Places API and Maps JavaScript API are enabled
4. Verify billing is enabled for your Google Cloud project

### Issue: Database Connection Errors
**Symptoms**: "Failed to connect to database" or timeout errors

**Solution**: 
1. Check Supabase project status (not paused)
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Test database connection from Supabase dashboard
4. Check Row Level Security policies

## 📋 Post-Deployment Testing

### ✅ Authentication Flow Testing
- [ ] Email/password sign up works
- [ ] Email/password sign in works
- [ ] Google OAuth sign in works
- [ ] Sign out works properly
- [ ] User profile creation works
- [ ] Profile photo upload works

### ✅ Core Functionality Testing
- [ ] Create new list works
- [ ] Add places to list works
- [ ] Edit list works
- [ ] Delete list works
- [ ] Search places works
- [ ] View public lists works
- [ ] Map view loads and functions
- [ ] Swipe view works on mobile

### ✅ Performance Testing
- [ ] Page load times < 3 seconds
- [ ] Images load properly
- [ ] No console errors
- [ ] Mobile responsiveness works
- [ ] Touch gestures work on mobile

### ✅ Security Testing
- [ ] HTTPS enforced
- [ ] Authentication required for protected routes
- [ ] RLS policies prevent unauthorized access
- [ ] Profile photos upload securely
- [ ] No sensitive data exposed in client

## 🛠️ Troubleshooting Commands

### Check Environment Variables
```bash
# In your deployment platform dashboard
echo $NEXT_PUBLIC_APP_URL
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### Test OAuth Flow
1. Open browser developer tools
2. Go to Network tab
3. Try Google sign in
4. Check redirect URLs in network requests
5. Verify no 400/500 errors

### Verify Supabase Connection
```javascript
// In browser console on your production site
console.log('App URL:', window.location.origin)
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

## 📊 Monitoring & Maintenance

### 🔍 Production Monitoring
- **Vercel Analytics** - Application performance and errors
- **Supabase Dashboard** - Database performance and usage
- **Google Cloud Console** - API usage and quotas
- **Browser Console** - Client-side errors and warnings

### 🔄 Regular Maintenance
- Monitor API usage and costs
- Review error logs weekly
- Update dependencies monthly
- Test critical flows after updates
- Monitor performance metrics

## 🆘 Getting Help

### 📋 Before Reporting Issues
1. Check this deployment guide for known solutions
2. Review logs in browser console and service dashboards
3. Verify all environment variables are correctly set
4. Test with fresh incognito/private browser window

### 🔗 Support Resources
- **[Troubleshooting Guide](../troubleshooting/)** - Common issues and solutions
- **[Google OAuth Setup](../troubleshooting/GOOGLE_OAUTH_SETUP.md)** - Detailed OAuth troubleshooting
- **[Deployment Checklist](../troubleshooting/DEPLOYMENT_CHECKLIST.md)** - Additional deployment checks

## 📖 Reference Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

*Last Updated: June 10, 2025* 