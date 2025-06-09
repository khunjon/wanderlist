# Performance Optimizations for Google Auth Redirect

## Issue
After successful Google authentication, the redirect from home page (`/`) to lists page (`/lists`) was slow.

## Root Causes Identified

1. **Multiple Redirect Hops**: Auth callback redirected to `/` which then redirected to `/lists`
2. **Redundant Database Calls**: `syncUserProfile` was making separate calls to update user activity
3. **Blocking List Fetching**: Lists page was fetching data synchronously during initial render
4. **Immediate Redirects**: No delay to allow auth state to settle

## Optimizations Implemented

### 1. Direct Redirect in Auth Callback
**File**: `src/app/auth/callback/page.tsx`
- **Change**: Redirect directly to `/lists` instead of `/`
- **Impact**: Eliminates one redirect hop, reducing total redirect time

### 2. Optimized User Profile Sync
**File**: `src/lib/supabase/auth.ts`
- **Change**: Removed separate `updateUserActivity` call since `last_active_at` is updated in the main upsert
- **Impact**: Reduces database calls from 2 to 1 during auth state change

### 3. Deferred List Fetching
**File**: `src/app/lists/page.tsx`
- **Change**: Use `setTimeout` to defer expensive list fetching operation
- **Impact**: Allows page to render immediately while lists load in background

### 4. Delayed Navbar Redirect
**File**: `src/components/layout/Navbar.tsx`
- **Change**: Added 100ms delay before redirecting from `/` to `/lists`
- **Impact**: Ensures auth state is fully settled before redirect

### 5. Optimistic Loading States
**File**: `src/app/lists/page.tsx`
- **Change**: Show page structure immediately, disable search input while loading
- **Impact**: Better perceived performance, immediate visual feedback

### 6. Performance Monitoring
**File**: `src/lib/utils/performance.ts` (new)
- **Change**: Added performance tracking utilities
- **Impact**: Ability to monitor auth redirect and list loading times in development

## Expected Performance Improvements

- **Redirect Time**: Reduced by ~200-500ms by eliminating redirect hop
- **Database Load**: Reduced by 50% during auth state changes
- **Perceived Performance**: Immediate page rendering instead of blocking on data fetch
- **User Experience**: Smoother transition with proper loading states

## Monitoring

Performance timers are now in place to track:
- `auth-redirect`: Time from auth state change to completion
- `lists-load`: Time to fetch and display user lists

These will log timing information in development mode for ongoing optimization.

## Database Recommendations

For further optimization, ensure the following database indexes exist:
- `lists(user_id, updated_at)` - for efficient user list queries
- `users(id)` - for user profile lookups (likely already exists)

## Testing

To verify improvements:
1. Clear browser cache and cookies
2. Sign in with Google OAuth
3. Monitor browser dev tools Network tab for redirect timing
4. Check console for performance timing logs (development mode) 