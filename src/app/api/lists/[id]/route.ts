import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Create a server-side Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Cache for user verification (in-memory, resets on cold start)
const userCache = new Map<string, { userId: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function verifyUserToken(authToken: string): Promise<string | null> {
  // Check cache first
  const cached = userCache.get(authToken);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.userId;
  }

  try {
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error } = await userSupabase.auth.getUser(authToken);
    
    if (error || !user) {
      return null;
    }
    
    // Cache the result
    userCache.set(authToken, { userId: user.id, timestamp: Date.now() });
    return user.id;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { id } = await params;
    
    // Get auth token early for potential parallel processing
    const cookieStore = await cookies();
    let authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      // Quick cookie check - only check the most common Supabase cookie patterns
      const sbCookies = cookieStore.getAll().filter(c => c.name.startsWith('sb-'));
      for (const cookie of sbCookies) {
        if (cookie.name.includes('auth-token')) {
          try {
            const parsed = JSON.parse(cookie.value);
            authToken = parsed.access_token || parsed;
            break;
          } catch {
            authToken = cookie.value;
            break;
          }
        }
      }
    }
    
    // Fetch list and places in parallel for better performance
    const [listResult, placesResult] = await Promise.all([
      supabaseAdmin
        .from('lists')
        .select('*')
        .eq('id', id)
        .maybeSingle(),
      supabaseAdmin
        .from('list_places')
        .select(`
          *,
          places (*)
        `)
        .eq('list_id', id)
    ]);
    
    const { data: list, error: listError } = listResult;
    const { data: listPlaces, error: placesError } = placesResult;
    
    if (listError) {
      console.error('Server-side list error:', listError);
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    // Fast path for public lists - skip auth entirely
    if (list.is_public) {
      const response = {
        list,
        places: listPlaces || []
      };
      
      // Add performance header
      const responseHeaders = new Headers();
      responseHeaders.set('X-Response-Time', `${Date.now() - startTime}ms`);
      responseHeaders.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      
      return NextResponse.json(response, { headers: responseHeaders });
    }
    
    // For private lists, verify authentication
    if (!authToken) {
      return NextResponse.json({ error: 'Authentication required for private list' }, { status: 401 });
    }
    
    const userId = await verifyUserToken(authToken);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }
    
    if (userId !== list.user_id) {
      return NextResponse.json({ error: 'Access denied to private list' }, { status: 403 });
    }
    
    const response = {
      list,
      places: listPlaces || []
    };
    
    // Add performance headers
    const responseHeaders = new Headers();
    responseHeaders.set('X-Response-Time', `${Date.now() - startTime}ms`);
    responseHeaders.set('Cache-Control', 'private, max-age=30');
    
    return NextResponse.json(response, { headers: responseHeaders });
    
  } catch (error) {
    console.error('Server-side API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 