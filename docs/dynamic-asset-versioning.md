# Dynamic Asset Versioning System

This guide explains the comprehensive dynamic asset versioning system implemented to force browsers to fetch new versions of your application with every deployment, breaking mobile caches effectively.

## Overview

The dynamic asset versioning system consists of:

1. **Build-time Version Generation** - Creates unique version identifiers
2. **Runtime Version Checking** - Detects when new versions are available
3. **Automatic Refresh Mechanisms** - Forces updates when needed
4. **Versioned Asset Loading** - Adds version parameters to critical assets
5. **User Notifications** - Informs users about available updates

## System Components

### 1. Version Generation (`scripts/generate-version.js`)

Automatically generates version information at build time:

```bash
# Manual generation
npm run version:generate

# Automatic generation (runs before build)
npm run build
```

**Generated Files:**
- `src/lib/version-info.json` - Version data file
- `src/lib/version-constants.ts` - TypeScript constants
- `.env.local` - Environment variables (NEXT_PUBLIC_*)

**Version Sources (in priority order):**
1. Vercel Git Commit SHA (production)
2. Local Git commit hash
3. Timestamp fallback

### 2. Version Utilities (`src/lib/utils/version.ts`)

Core utilities for version management:

```typescript
import { 
  getCurrentVersion, 
  createVersionedAssetUrl, 
  checkVersionMatch,
  forceAppRefresh 
} from '@/lib/utils/version';

// Get current version info
const version = getCurrentVersion();

// Create versioned asset URL
const versionedUrl = createVersionedAssetUrl('/api/data');

// Check for version mismatch
const result = await checkVersionMatch();
if (result.shouldRefresh) {
  forceAppRefresh();
}
```

### 3. Version Checking Hooks (`src/hooks/useVersionCheck.tsx`)

React hooks for version management:

```typescript
import { 
  useVersionCheck, 
  useManualRefresh, 
  useVersionDisplay 
} from '@/hooks/useVersionCheck';

function MyComponent() {
  // Automatic version checking
  const { shouldRefresh, currentVersion, latestVersion } = useVersionCheck({
    checkInterval: 5 * 60 * 1000, // 5 minutes
    autoRefresh: false,
    onVersionMismatch: (state) => {
      console.log('New version available:', state.latestVersion);
    }
  });

  // Manual refresh with confirmation
  const { refreshWithConfirmation } = useManualRefresh();

  // Version display
  const { displayVersion } = useVersionDisplay();

  return (
    <div>
      <p>Version: {displayVersion}</p>
      {shouldRefresh && (
        <button onClick={() => refreshWithConfirmation()}>
          Update Available - Refresh Now
        </button>
      )}
    </div>
  );
}
```

### 4. Version Notification (`src/components/version/VersionNotification.tsx`)

Automatic update notifications:

```typescript
import VersionNotification, { 
  CompactVersionNotification 
} from '@/components/version/VersionNotification';

// Full notification (desktop)
<VersionNotification 
  autoCheck={true}
  checkInterval={5 * 60 * 1000}
  position="top"
  showVersionInfo={true}
/>

// Compact notification (mobile)
<CompactVersionNotification />
```

### 5. Versioned Assets (`src/components/version/VersionedAssets.tsx`)

Components for loading versioned assets:

```typescript
import { 
  VersionedScript, 
  VersionedStyle, 
  VersionedPreloader,
  useVersionedUrl 
} from '@/components/version/VersionedAssets';

function MyPage() {
  // Load versioned JavaScript
  <VersionedScript 
    src="/js/analytics.js" 
    async={true}
    onLoad={() => console.log('Script loaded')}
  />

  // Load versioned CSS
  <VersionedStyle 
    href="/css/custom.css"
    onLoad={() => console.log('Styles loaded')}
  />

  // Preload critical assets
  <VersionedPreloader assets={[
    { href: '/js/critical.js', as: 'script' },
    { href: '/css/critical.css', as: 'style' }
  ]} />

  // Use versioned URL in components
  const versionedApiUrl = useVersionedUrl('/api/data');
}
```

## Implementation Examples

### 1. API Routes with Version Headers

```typescript
// src/app/api/data/route.ts
import { createNoCacheResponse } from '@/lib/utils/cache';
import { getCurrentVersion } from '@/lib/utils/version';

export async function GET() {
  const data = await fetchData();
  const version = getCurrentVersion();
  
  return createNoCacheResponse(data, 200, {
    'X-App-Version': version.version,
    'X-Build-Time': version.buildTime,
  });
}
```

### 2. Component with Version Awareness

```typescript
import { withVersioning } from '@/components/version/VersionedAssets';

function DataComponent({ data }: { data: any }) {
  return <div>{data.content}</div>;
}

// Wrap with version awareness
export default withVersioning(DataComponent);
```

### 3. Dynamic Import with Versioning

```typescript
import { VersionedDynamicImport } from '@/components/version/VersionedAssets';
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
});

function MyPage() {
  return (
    <VersionedDynamicImport fallback={<div>Loading...</div>}>
      <DynamicComponent />
    </VersionedDynamicImport>
  );
}
```

### 4. Version-Aware Navigation

```typescript
import { useVersionAwareNavigation } from '@/hooks/useVersionCheck';
import { useRouter } from 'next/navigation';

function NavigationComponent() {
  const router = useRouter();
  const { checkBeforeNavigation } = useVersionAwareNavigation();

  const handleImportantNavigation = () => {
    checkBeforeNavigation(() => {
      router.push('/important-page');
    });
  };

  return (
    <button onClick={handleImportantNavigation}>
      Go to Important Page
    </button>
  );
}
```

## Configuration Options

### Version Check Intervals

```typescript
// Conservative (every 10 minutes)
const { shouldRefresh } = useVersionCheck({
  checkInterval: 10 * 60 * 1000
});

// Aggressive (every 2 minutes)
const { shouldRefresh } = useVersionCheck({
  checkInterval: 2 * 60 * 1000
});

// Manual only (no automatic checking)
const { checkVersion } = useVersionCheck({
  checkInterval: undefined
});
```

### Auto-Refresh Behavior

```typescript
// Automatic refresh (no user interaction)
useVersionCheck({
  autoRefresh: true,
  checkInterval: 5 * 60 * 1000
});

// Manual refresh with notification
useVersionCheck({
  autoRefresh: false,
  onVersionMismatch: (state) => {
    showUpdateNotification(state);
  }
});
```

## Build Integration

### Package.json Scripts

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-version.js",
    "build": "next build",
    "version:generate": "node scripts/generate-version.js",
    "version:check": "node -e \"console.log(require('./src/lib/version-info.json'))\""
  }
}
```

### Vercel Deployment

The system automatically uses Vercel's `VERCEL_GIT_COMMIT_SHA` environment variable in production:

```bash
# Vercel automatically provides:
VERCEL_GIT_COMMIT_SHA=abc123def456...

# Which becomes:
NEXT_PUBLIC_APP_VERSION=abc123de
NEXT_PUBLIC_GIT_HASH=abc123de
```

### Environment Variables

```bash
# Auto-generated by build script
NEXT_PUBLIC_APP_VERSION=9d4d8aa
NEXT_PUBLIC_BUILD_TIME=2025-06-12T09:00:38.237Z
NEXT_PUBLIC_GIT_HASH=9d4d8aa
```

## Mobile Browser Considerations

### Aggressive Cache Breaking

The system is specifically designed for mobile browsers:

1. **Version Parameters**: Added to all critical assets
2. **Meta Tags**: Version info in document head
3. **Session Storage**: Tracks version changes
4. **Force Reload**: Bypasses all caches

### iOS Safari Specific

```typescript
// Force reload that works on iOS Safari
function forceAppRefresh() {
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => caches.delete(cacheName));
    });
  }
  window.location.reload();
}
```

### Android Chrome Specific

```typescript
// Service worker cache clearing
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.update());
  });
}
```

## Testing and Debugging

### Version Information

```typescript
// Get debug info
import { getVersionDebugInfo } from '@/lib/utils/version';
console.log(getVersionDebugInfo());
```

### Manual Testing

```bash
# Generate new version
npm run version:generate

# Check current version
npm run version:check

# Test version API
curl -I http://localhost:3000/api/version
```

### Browser DevTools

1. **Network Tab**: Check for version parameters in requests
2. **Application Tab**: Check meta tags and session storage
3. **Console**: Look for version check logs

## Performance Impact

### Benefits
- **Immediate Updates**: Users get latest version instantly
- **Bug Fixes**: Critical fixes deployed immediately
- **Cache Consistency**: No stale content issues

### Considerations
- **Increased Requests**: More server hits due to cache busting
- **Bandwidth Usage**: Assets re-downloaded more frequently
- **Battery Impact**: More frequent version checks on mobile

### Optimization Strategies

```typescript
// Reduce check frequency for battery saving
const isLowPowerMode = navigator.getBattery?.()?.then(battery => battery.charging === false);

const checkInterval = isLowPowerMode ? 15 * 60 * 1000 : 5 * 60 * 1000;

useVersionCheck({ checkInterval });
```

## Troubleshooting

### Common Issues

1. **Version Not Updating**
   - Check if `prebuild` script runs
   - Verify environment variables are set
   - Check git repository status

2. **Infinite Refresh Loop**
   - Check version comparison logic
   - Verify session storage is working
   - Check for version API errors

3. **Mobile Cache Issues**
   - Verify meta tags are present
   - Check service worker cache clearing
   - Test force reload mechanism

### Debug Commands

```bash
# Check generated version files
cat src/lib/version-info.json
cat src/lib/version-constants.ts

# Test version API
curl -s http://localhost:3000/api/version | jq

# Check environment variables
env | grep NEXT_PUBLIC_APP
```

## Best Practices

1. **Version Check Frequency**: Balance between freshness and performance
2. **User Experience**: Always provide manual refresh option
3. **Error Handling**: Graceful fallbacks when version checks fail
4. **Testing**: Test on real mobile devices regularly
5. **Monitoring**: Track version adoption rates and refresh patterns

## Migration Guide

### From Manual Cache Busting

```typescript
// Before: Manual cache busting
const url = `/api/data?cb=${Date.now()}`;

// After: Version-based cache busting
const url = createVersionedAssetUrl('/api/data');
```

### From Static Versioning

```typescript
// Before: Static version
const VERSION = '1.0.0';

// After: Dynamic versioning
const version = getCurrentVersion().version;
```

This system ensures your users always have the latest version of your application, breaking even the most aggressive mobile browser caches. 