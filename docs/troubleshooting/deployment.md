# 🚀 Deployment Troubleshooting

This guide covers deployment issues including environment configuration, build failures, Vercel deployment problems, and production vs development differences.

## 🚨 Quick Fixes for Critical Deployment Issues

### **🔥 Build Completely Fails**
```bash
# 1. Clear all caches and reinstall
rm -rf .next node_modules package-lock.json
npm install

# 2. Check for TypeScript errors
npm run type-check

# 3. Test build locally
npm run build

# 4. Check environment variables
npm run check-env
```

### **🔥 App Loads but Features Don't Work**
```bash
# 1. Check environment variables in production
# Vercel Dashboard → Project → Settings → Environment Variables

# 2. Check for hardcoded localhost URLs
grep -r "localhost" src/

# 3. Verify API endpoints are accessible
curl https://your-domain.com/api/health

# 4. Check browser console for errors
```

### **🔥 Authentication Fails in Production**
```bash
# 1. Check Google OAuth redirect URIs
# Google Cloud Console → Add production domain

# 2. Check Supabase allowed origins
# Supabase Dashboard → Authentication → URL Configuration

# 3. Verify environment variables
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

---

## 🔍 Common Deployment Issues

### **1. Environment Variable Issues**

#### **Symptoms**
- Features work locally but fail in production
- API calls return 401/403 errors
- Database connections fail
- Google OAuth doesn't work

#### **Debugging Steps**
```bash
# Check if environment variables are set
console.log('Environment check:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL
})
```

#### **Required Environment Variables**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tbabdwdhostkadpwwbhy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps Integration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# MCP Configuration (optional)
SUPABASE_PERSONAL_ACCESS_TOKEN=your-personal-access-token
```

#### **Vercel Environment Variable Setup**
1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add each variable** with appropriate environment (Production, Preview, Development)
3. **Redeploy** after adding variables
4. **Test** that variables are accessible in production

---

### **2. Build Process Failures**

#### **Common Build Errors**

##### **TypeScript Compilation Errors**
```bash
# Error: Type errors during build
Type error: Property 'xyz' does not exist on type 'ABC'

# Solution: Fix TypeScript errors
npm run type-check
# Fix all reported errors
npm run build
```

##### **Missing Dependencies**
```bash
# Error: Module not found
Module not found: Can't resolve 'some-package'

# Solution: Install missing dependencies
npm install some-package
# Or if it's a dev dependency
npm install --save-dev some-package
```

##### **Import/Export Issues**
```bash
# Error: Named export not found
Named export 'ComponentName' not found

# Solution: Check import/export statements
# Ensure exports match imports exactly
export { ComponentName } from './component'
import { ComponentName } from './component'
```

#### **Build Optimization Issues**
```bash
# Large bundle size warnings
Warning: Bundle size exceeds recommended limit

# Solution: Analyze bundle
npm run analyze
# Use dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'))
```

---

### **3. Vercel Deployment Issues**

#### **Deployment Fails**
```bash
# Check Vercel build logs
# Vercel Dashboard → Deployments → Click on failed deployment → View logs

# Common issues:
# 1. Build command fails
# 2. Environment variables missing
# 3. Node.js version mismatch
# 4. Memory limits exceeded
```

#### **Vercel Configuration**
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

#### **Domain and SSL Issues**
```bash
# Custom domain not working
# 1. Check DNS configuration
# 2. Verify domain ownership
# 3. Check SSL certificate status

# SSL certificate issues
# 1. Wait for automatic certificate generation
# 2. Check domain verification
# 3. Contact Vercel support if needed
```

---

### **4. Production vs Development Differences**

#### **API Endpoint Issues**
```typescript
// Problem: Hardcoded localhost URLs
const response = await fetch('http://localhost:3000/api/lists')

// Solution: Use relative URLs or environment variables
const response = await fetch('/api/lists')
// Or
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
const response = await fetch(`${baseUrl}/api/lists`)
```

#### **Database Connection Issues**
```typescript
// Problem: Different connection strings
const supabaseUrl = 'http://localhost:54321' // Development

// Solution: Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
```

#### **Authentication Redirect Issues**
```typescript
// Problem: Redirects to localhost
redirectTo: 'http://localhost:3000/auth/callback'

// Solution: Dynamic redirect URL
redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`
```

---

### **5. Performance Issues in Production**

#### **Slow Initial Load**
```bash
# Check bundle size
npm run analyze

# Optimize images
# Use Next.js Image component with optimization
import Image from 'next/image'

# Enable compression
# Vercel automatically enables gzip/brotli compression
```

#### **API Response Times**
```bash
# Check API performance
# Vercel Dashboard → Functions → View logs and metrics

# Optimize database queries
# Use database functions instead of multiple API calls
# Implement proper caching headers
```

#### **Static Generation Issues**
```typescript
// Problem: Dynamic content not updating
// Solution: Use ISR (Incremental Static Regeneration)
export async function getStaticProps() {
  return {
    props: { data },
    revalidate: 60 // Revalidate every 60 seconds
  }
}
```

---

## 🛠️ Advanced Deployment Debugging

### **Vercel CLI Debugging**
```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link

# Deploy from CLI with logs
vercel --debug

# Check deployment logs
vercel logs your-deployment-url

# Test functions locally
vercel dev
```

### **Production Environment Testing**
```bash
# Test production build locally
npm run build
npm run start

# Test with production environment variables
cp .env.production .env.local
npm run dev

# Test API endpoints
curl -X GET "https://your-domain.com/api/lists" \
  -H "Authorization: Bearer your-jwt-token"
```

### **Performance Monitoring**
```bash
# Check Core Web Vitals
# Use Google PageSpeed Insights
# Check Vercel Analytics dashboard

# Monitor API performance
# Vercel Dashboard → Functions → Performance metrics
# Set up alerts for slow functions
```

---

## 📋 Deployment Checklist

### **Pre-Deployment**
- [ ] All tests pass locally
- [ ] Build succeeds locally (`npm run build`)
- [ ] TypeScript compilation succeeds
- [ ] Environment variables documented
- [ ] No hardcoded localhost URLs
- [ ] Database migrations applied

### **Environment Configuration**
- [ ] All environment variables set in Vercel
- [ ] Google OAuth redirect URIs updated
- [ ] Supabase allowed origins configured
- [ ] API keys have correct permissions
- [ ] Domain DNS configured correctly

### **Post-Deployment Testing**
- [ ] App loads without errors
- [ ] Authentication flow works
- [ ] Database operations work
- [ ] API endpoints respond correctly
- [ ] Google Maps integration works
- [ ] Performance is acceptable

### **Monitoring Setup**
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Alerts set up for critical issues

---

## 🔗 Related Documentation

### **Setup and Configuration**
- **[Production Deployment](../setup/production-deployment.md)** - Complete deployment guide
- **[Environment Setup](../setup/development-environment.md)** - Environment configuration
- **[Supabase Configuration](../setup/supabase-configuration.md)** - Database setup

### **Specific Issues**
- **[Authentication Troubleshooting](./auth.md)** - Auth-specific deployment issues
- **[Database Troubleshooting](./database.md)** - Database connection issues
- **[Performance Troubleshooting](./performance.md)** - Performance optimization

### **Legacy Documentation**
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Detailed deployment checklist
- **[Cache Clearing Guide](./CACHE_CLEARING_GUIDE.md)** - Development cache issues

---

## 🆘 When to Escalate

### **Level 1: Self-Service (5-15 minutes)**
1. Check build logs for obvious errors
2. Verify environment variables are set
3. Test build locally
4. Check for hardcoded URLs

### **Level 2: Detailed Investigation (15-60 minutes)**
1. Compare production vs development configuration
2. Test API endpoints directly
3. Check third-party service configurations
4. Review performance metrics

### **Level 3: Platform Support (1+ hours)**
1. **Vercel Support** - For platform-specific deployment issues
2. **Supabase Support** - For database connectivity in production
3. **Google Cloud Support** - For Maps API or OAuth issues
4. **DNS Provider Support** - For domain and SSL issues

### **Level 4: Development Team**
1. **Code Review** - For complex build or runtime issues
2. **Architecture Review** - For performance or scalability issues
3. **Security Review** - For authentication or data security issues

---

*🚀 Deployment issues often involve multiple services working together. Always verify each component individually before investigating complex interactions.*

*Last Updated: June 10, 2025* 