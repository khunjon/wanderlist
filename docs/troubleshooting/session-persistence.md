# 🔐 Session Persistence & Auth Debugging Guide

This guide covers the enhanced authentication system with improved session persistence, error handling, and debugging capabilities.

## 🚀 New Features Overview

### **✅ Enhanced Session Persistence**
- **Automatic session validation** on app startup
- **Token refresh with retry mechanism** (up to 3 attempts with exponential backoff)
- **Session monitoring** that runs in the background
- **Graceful session recovery** when tokens expire
- **Improved error classification** and handling

### **✅ Comprehensive Error Handling**
- **Smart error classification** (network, auth, session, unknown)
- **Automatic retry logic** for recoverable errors
- **User-friendly error recovery UI**
- **Detailed logging** for debugging

### **✅ Advanced Debugging Tools**
- **Real-time auth debug panel** (development only)
- **Session status monitoring**
- **Comprehensive logging system**
- **Manual retry functionality**

---

## 🔧 Technical Implementation

### **Session Validation on Startup**

The app now performs comprehensive session validation when it starts:

```typescript
// Automatic startup validation
const startupResult = await validateSessionOnStartup();

if (startupResult.isAuthenticated) {
  // User is authenticated, session is valid
  console.log('Session recovered:', startupResult.recovered);
} else {
  // No valid session, user needs to sign in
}
```

### **Token Refresh with Retry**

Failed token refreshes are automatically retried with exponential backoff:

```typescript
// Automatic retry with backoff
const refreshResult = await refreshSessionWithRetry(maxRetries = 3);

if (refreshResult.success) {
  // Token refreshed successfully
} else {
  // All retry attempts failed
  console.error('Refresh failed:', refreshResult.error);
}
```

### **Session Monitoring**

Background monitoring checks session health and refreshes tokens proactively:

```typescript
// Automatic session monitoring
const monitor = new SessionMonitor({
  onSessionExpired: () => {
    // Handle expired session
  },
  onSessionRefreshed: (session) => {
    // Handle successful refresh
  },
  onError: (error) => {
    // Handle monitoring errors
  }
});

monitor.start(); // Check every minute
```

---

## 🐛 Debugging Features

### **Auth Debug Panel** (Development Only)

The debug panel shows real-time authentication status:

- **Session Status**: Valid, Expired, Needs Refresh, Invalid
- **User Information**: ID, email, provider
- **Session Details**: Expiration time, last check
- **Error Information**: Current errors with retry button
- **Environment**: Supabase URL/key status
- **Storage**: Local storage auth keys

**Usage:**
- Only visible in development mode
- Click to expand/collapse
- Color-coded status (green=good, yellow=loading, red=error)
- Manual retry button for auth errors

### **Comprehensive Logging**

All auth operations are logged with different levels:

```typescript
// Debug logs (development only)
authLogger.debug('Session validation result:', { userId, isValid });

// Info logs (always shown)
authLogger.info('User signed in successfully');

// Warning logs
authLogger.warn('Session expired, attempting recovery');

// Error logs
authLogger.error('Authentication failed:', error);
```

**Log Format:**
```
[AUTH DEBUG] Session validation result: { userId: "123", isValid: true }
[AUTH INFO] Startup validation successful
[AUTH WARN] Session expired, attempting recovery
[AUTH ERROR] Token refresh failed: Invalid grant
```

### **Session Recovery UI**

When auth errors occur, users see a friendly recovery interface:

- **Smart Error Detection**: Distinguishes between session and other errors
- **Recovery Options**: Try to recover automatically or sign in again
- **Progress Indicators**: Shows recovery attempts in progress
- **Fallback Actions**: Refresh page or sign in manually

---

## 🔍 Common Issues & Solutions

### **Issue: Users Getting Logged Out Randomly**

**Symptoms:**
- User appears logged in but gets 401 errors
- Session expires without warning
- User has to log in frequently

**Root Causes & Solutions:**

#### **1. Token Expiration**
```typescript
// Now handled automatically
const validation = await validateSession();
if (validation.needsRefresh) {
  await refreshSessionWithRetry();
}
```

#### **2. Network Issues**
```typescript
// Automatic retry with exponential backoff
if (classification.isRetryable && retryCount < 3) {
  await retryAuth();
}
```

#### **3. Browser Storage Issues**
```typescript
// Automatic cleanup of stale data
await clearStaleSessionData();
```

### **Issue: Session Not Persisting Across Browser Tabs**

**Solution:**
Enhanced Supabase client configuration:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    debug: process.env.NODE_ENV === 'development'
  }
});
```

### **Issue: Redirect Loop After Google OAuth**

**Symptoms:**
- User completes Google OAuth successfully
- Gets redirected back to login page repeatedly
- Console shows authentication is successful but page keeps redirecting

**Root Cause:**
Race condition between middleware session checking and OAuth callback processing.

**Solution:**
Enhanced middleware with OAuth callback detection:

```typescript
// Skip auth checks for auth-related routes to prevent redirect loops
if (pathname.startsWith('/auth/') || 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup')) {
  return response;
}

// Check for recent auth activity to avoid premature redirects
const hasRecentAuthActivity = request.headers.get('referer')?.includes('/auth/callback') ||
                             request.cookies.get('sb-auth-token') ||
                             request.cookies.get('sb-refresh-token');

if (hasRecentAuthActivity) {
  console.log('Detected recent auth activity, allowing client-side auth handling');
  return response;
}
```

**Emergency Fix:**
```bash
# 1. Clear all browser storage
localStorage.clear()
sessionStorage.clear()

# 2. Hard refresh the page
Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# 3. Test in incognito/private mode

# 4. Check browser console for [AUTH CALLBACK] logs
```

### **Issue: Auth Errors Not Handled Gracefully**

**Solution:**
Smart error classification and handling:

```typescript
const classification = classifyAuthError(error);

if (classification.shouldSignOut) {
  // Clear session and redirect to login
  await clearStaleSessionData();
} else if (classification.isRetryable) {
  // Attempt automatic recovery
  await retryAuth();
}
```

---

## 📊 Monitoring & Analytics

### **Session Health Metrics**

Track session health with these metrics:

- **Session Recovery Rate**: How often sessions are recovered vs. requiring re-login
- **Token Refresh Success Rate**: Success rate of automatic token refreshes
- **Error Classification**: Types of auth errors encountered
- **Recovery Time**: How long session recovery takes

### **Debug Information**

Access debug information in development:

```typescript
// Check session status
const validation = await validateSession();
console.log('Session valid:', validation.isValid);
console.log('Needs refresh:', validation.needsRefresh);
console.log('Expires at:', new Date(validation.session?.expires_at * 1000));

// Check auth state
const { user, loading, error, sessionRecovered } = useAuth();
console.log('Auth state:', { user: !!user, loading, error, sessionRecovered });
```

---

## 🚀 Best Practices

### **For Developers**

1. **Use the Enhanced useAuth Hook**
   ```typescript
   const { user, loading, error, retryAuth, sessionRecovered } = useAuth();
   ```

2. **Handle Auth Errors Gracefully**
   ```typescript
   if (error) {
     // SessionRecovery component will handle this automatically
     // Or manually trigger retry: await retryAuth();
   }
   ```

3. **Monitor Session Status**
   ```typescript
   // Check if session was recovered
   if (sessionRecovered) {
     console.log('Session was automatically recovered');
   }
   ```

### **For Users**

1. **Session Recovery**: If you see a "Session Expired" dialog, try the "Try to Recover" button first
2. **Network Issues**: If auth fails, the app will automatically retry
3. **Persistent Issues**: Use the "Sign In Again" button for a fresh start

### **For Debugging**

1. **Enable Debug Panel**: Only visible in development mode
2. **Check Browser Console**: Look for `[AUTH DEBUG]` logs
3. **Monitor Network Tab**: Check for failed auth requests
4. **Test Session Recovery**: Manually expire tokens to test recovery

---

## 🔧 Configuration Options

### **Session Monitor Settings**

```typescript
const monitor = new SessionMonitor({
  onSessionExpired: handleExpiredSession,
  onSessionRefreshed: handleRefreshedSession,
  onError: handleMonitorError
});

// Check every 30 seconds instead of default 60 seconds
monitor.start(30000);
```

### **Retry Configuration**

```typescript
// Customize retry behavior
const refreshResult = await refreshSessionWithRetry(
  maxRetries = 5,  // Default: 3
);
```

### **Logging Configuration**

```typescript
// Logs are automatically configured based on NODE_ENV
// Development: All logs including debug
// Production: Info, warn, error only
```

---

## 📚 API Reference

### **Auth Utilities**

#### **validateSession()**
```typescript
const result = await validateSession();
// Returns: { isValid, session, error?, needsRefresh?, isExpired? }
```

#### **refreshSessionWithRetry(maxRetries?)**
```typescript
const result = await refreshSessionWithRetry(3);
// Returns: { success, session, error?, retryCount? }
```

#### **validateSessionOnStartup()**
```typescript
const result = await validateSessionOnStartup();
// Returns: { isAuthenticated, user, session, recovered }
```

#### **clearStaleSessionData()**
```typescript
await clearStaleSessionData();
// Clears localStorage and signs out locally
```

### **Enhanced useAuth Hook**

```typescript
const {
  user,              // Current user object
  loading,           // Auth loading state
  error,             // Current auth error
  supabaseUser,      // Raw Supabase user
  signOut,           // Sign out function
  refreshProfile,    // Refresh user profile
  retryAuth,         // Manual retry function
  sessionRecovered   // Whether session was recovered
} = useAuth();
```

---

## 🔗 Related Documentation

- **[Authentication Troubleshooting](./auth.md)** - General auth troubleshooting
- **[Supabase Configuration](../setup/supabase-configuration.md)** - Initial setup
- **[API Documentation](../api/auth.md)** - Auth API reference
- **[Security Model](../security/README.md)** - Security architecture

---

*Last Updated: January 15, 2025* 