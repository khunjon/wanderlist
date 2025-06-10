# API Migration & Optimization Plan

## Overview

This document provides a step-by-step plan to migrate the entire application from client-side Supabase queries to server-side API routes, based on the successful pattern implemented for list pages.

## Current State Analysis

### ✅ Already Migrated
- **List Detail Pages** (`/lists/[id]`): Successfully using `/api/lists/[id]` route

### 🔄 Needs Migration

#### High Priority (Performance Critical)
1. **Lists Overview** (`/lists`): User's personal lists
2. **Discover Page** (`/discover`): Public lists discovery
3. **Search Functionality** (`/search`): Place search
4. **Profile Pages** (`/profile`): User profiles

#### Medium Priority (Functionality Critical)
5. **List Management**: Create, update, delete operations
6. **Place Management**: Add, remove, update places
7. **User Authentication**: Login, signup, profile updates

#### Low Priority (Enhancement)
8. **Analytics**: View tracking, user behavior
9. **Admin Functions**: Admin dashboard operations

## Migration Plan

### Phase 1: Core Data Fetching (Week 1)

#### 1.1 Lists Overview Page
**Current Issue**: Multiple client-side queries for user lists
```typescript
// Current problematic pattern
const { data: lists } = await supabase
  .from('lists')
  .select('*')
  .eq('user_id', user.id)
```

**Migration Steps**:

1. **Create API Route**: `/api/users/[id]/lists`
```typescript
// src/app/api/users/[id]/lists/route.ts
export async function GET(request, { params }) {
  const { id: userId } = await params;
  
  // Get user from auth header or session
  const user = await getAuthenticatedUser(request);
  
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabaseAdmin
    .from('lists')
    .select(`
      *,
      list_places(count),
      users!inner(display_name, photo_url)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
    
  return NextResponse.json(data);
}
```

2. **Update Client Component**: `src/app/lists/page.tsx`
```typescript
// Replace direct Supabase calls with API fetch
const fetchUserLists = async () => {
  const response = await fetch(`/api/users/${user.id}/lists`);
  const lists = await response.json();
  setLists(lists);
};
```

#### 1.2 Discover Page
**Current Issue**: Complex public lists queries with filtering

**Migration Steps**:

1. **Create API Route**: `/api/discover`
```typescript
// src/app/api/discover/route.ts
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'view_count';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  let query = supabaseAdmin
    .from('lists')
    .select(`
      *,
      users!inner(display_name, photo_url),
      list_places(count)
    `)
    .eq('is_public', true);
    
  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('name', `%${search}%`);
  
  const { data, error } = await query
    .order(sortBy, { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
    
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
```

#### 1.3 Search Functionality
**Current Issue**: Client-side place search with Google Places API

**Migration Steps**:

1. **Create API Route**: `/api/search/places`
```typescript
// src/app/api/search/places/route.ts
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }
  
  // Use Google Places API server-side
  const places = await searchGooglePlaces(query, lat, lng);
  
  return NextResponse.json(places, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600' // Cache for 1 hour
    }
  });
}
```

### Phase 2: Mutations & Complex Operations (Week 2)

#### 2.1 List Management Operations

1. **Create List**: `/api/lists` (POST)
2. **Update List**: `/api/lists/[id]` (PUT/PATCH)
3. **Delete List**: `/api/lists/[id]` (DELETE)

#### 2.2 Place Management Operations

1. **Add Place to List**: `/api/lists/[id]/places` (POST)
2. **Remove Place**: `/api/lists/[id]/places/[placeId]` (DELETE)
3. **Update Place Notes**: `/api/lists/[id]/places/[placeId]` (PATCH)

### Phase 3: Authentication & User Management (Week 3)

#### 3.1 User Profile Operations

1. **Get Profile**: `/api/users/[id]` (GET)
2. **Update Profile**: `/api/users/[id]` (PATCH)
3. **Upload Profile Photo**: `/api/users/[id]/photo` (POST)

## Implementation Guidelines

### 1. Create Shared Admin Client

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### 2. Authentication Middleware

```typescript
// src/lib/auth/middleware.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) return null;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  return error ? null : user;
}
```

### 3. Consistent Error Handling

```typescript
// src/lib/api/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected API error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### 4. Input Validation

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

export const createListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(false),
  category: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export const updateListSchema = createListSchema.partial();
```

## File-by-File Migration Checklist

### 📁 Pages to Update

- [ ] `src/app/lists/page.tsx` - User lists overview
- [ ] `src/app/discover/page.tsx` - Public lists discovery  
- [ ] `src/app/search/page.tsx` - Place search
- [ ] `src/app/profile/page.tsx` - User profile
- [ ] `src/components/AddPlaceModal.tsx` - Add place functionality
- [ ] `src/components/EditListModal.tsx` - Edit list functionality

### 📁 API Routes to Create

- [ ] `src/app/api/users/[id]/lists/route.ts`
- [ ] `src/app/api/discover/route.ts`
- [ ] `src/app/api/search/places/route.ts`
- [ ] `src/app/api/lists/route.ts` (POST)
- [ ] `src/app/api/lists/[id]/route.ts` (PUT, DELETE)
- [ ] `src/app/api/lists/[id]/places/route.ts`
- [ ] `src/app/api/users/[id]/route.ts`

### 📁 Utilities to Create

- [ ] `src/lib/supabase/admin.ts` - Admin client
- [ ] `src/lib/auth/middleware.ts` - Auth helpers
- [ ] `src/lib/api/errors.ts` - Error handling
- [ ] `src/lib/validation/schemas.ts` - Input validation

## Performance Optimizations

### 1. Database Indexes

```sql
-- Add indexes for common queries
CREATE INDEX idx_lists_user_id_updated_at ON lists(user_id, updated_at DESC);
CREATE INDEX idx_lists_public_view_count ON lists(is_public, view_count DESC) WHERE is_public = true;
CREATE INDEX idx_list_places_list_id ON list_places(list_id);
CREATE INDEX idx_places_google_place_id ON places(google_place_id);
```

### 2. Caching Strategy

```typescript
// Add caching headers to API routes
const cacheHeaders = {
  // Public data - cache for 5 minutes
  'public': 'public, s-maxage=300, stale-while-revalidate=600',
  // User-specific data - cache for 1 minute
  'private': 'private, max-age=60',
  // Static data - cache for 1 hour
  'static': 'public, s-maxage=3600, stale-while-revalidate=7200'
};
```

### 3. Query Optimization

```typescript
// Use select with specific fields and joins
const optimizedQuery = supabaseAdmin
  .from('lists')
  .select(`
    id,
    name,
    description,
    is_public,
    view_count,
    created_at,
    updated_at,
    users!inner(
      id,
      display_name,
      photo_url
    ),
    list_places(count)
  `);
```

## Testing Strategy

### 1. API Route Testing

```typescript
// tests/api/lists.test.ts
import { GET } from '@/app/api/lists/[id]/route';

describe('/api/lists/[id]', () => {
  it('should return list data for valid ID', async () => {
    const request = new Request('http://localhost/api/lists/123');
    const response = await GET(request, { params: Promise.resolve({ id: '123' }) });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('list');
    expect(data).toHaveProperty('places');
  });
});
```

### 2. Integration Testing

```typescript
// tests/integration/list-flow.test.ts
describe('List Management Flow', () => {
  it('should create, read, update, and delete a list', async () => {
    // Test full CRUD operations via API routes
  });
});
```

## Monitoring & Observability

### 1. API Metrics

```typescript
// Add to API routes
console.log(`API ${request.method} ${pathname} - ${Date.now() - startTime}ms`);
```

### 2. Error Tracking

```typescript
// Add error tracking service
import * as Sentry from '@sentry/nextjs';

export function logAPIError(error: Error, context: any) {
  Sentry.captureException(error, { extra: context });
}
```

## Rollback Plan

### If Issues Arise:

1. **Feature Flags**: Use environment variables to toggle between old/new implementations
2. **Gradual Rollout**: Migrate one page at a time
3. **Monitoring**: Watch for increased error rates or performance issues
4. **Quick Revert**: Keep old client-side code commented out for quick rollback

## Success Metrics

### Performance Targets:
- **API Response Time**: < 200ms for 95th percentile
- **Page Load Time**: < 1 second for list pages
- **Error Rate**: < 1% for API calls

### Reliability Targets:
- **Uptime**: 99.9% for API routes
- **No Hanging Queries**: 0% timeout rate
- **Consistent Behavior**: Same performance on reload vs fresh load

## Timeline

### Week 1: Core Data Fetching
- Day 1-2: Lists overview migration
- Day 3-4: Discover page migration  
- Day 5: Search functionality migration

### Week 2: Mutations & Operations
- Day 1-3: List CRUD operations
- Day 4-5: Place management operations

### Week 3: Polish & Optimization
- Day 1-2: User management APIs
- Day 3-4: Performance optimization
- Day 5: Testing and monitoring

## Post-Migration Cleanup

### Remove Unused Code:
- [ ] Old client-side query functions in `/lib/supabase/`
- [ ] Unused RLS policies (if any)
- [ ] Debug logging and temporary fixes
- [ ] Commented-out code blocks

### Update Documentation:
- [ ] API documentation
- [ ] Component usage examples
- [ ] Deployment guides
- [ ] Troubleshooting guides

This migration will transform your app into a more reliable, scalable, and maintainable system following industry best practices. 