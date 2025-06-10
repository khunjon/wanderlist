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

// Create a client for user authentication
const createUserClient = (request: NextRequest) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || ''
        }
      }
    }
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('Server-side: Fetching list with ID:', id);
    
    // Use service role to fetch the list first
    const { data: list, error: listError } = await supabaseAdmin
      .from('lists')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (listError) {
      console.error('Server-side list error:', listError);
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    
    if (!list) {
      console.log('Server-side: No list found for ID:', id);
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }
    
    console.log('Server-side: Found list:', list.name, 'Public:', list.is_public);
    
    // If list is not public, check if user has access
    if (!list.is_public) {
      // Get user from session - try multiple sources
      const cookieStore = await cookies();
      let authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
      
      // If no Authorization header, try to get from cookies
      if (!authToken) {
        // Debug: log all available cookies
        const allCookies = cookieStore.getAll();
        console.log('Server-side: Available cookies:', allCookies.map(c => c.name));
        
        // Try different cookie names that Supabase might use
        const possibleCookies = [
          'sb-access-token',
          'supabase-auth-token',
          `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
        ];
        
        for (const cookieName of possibleCookies) {
          const cookie = cookieStore.get(cookieName);
          if (cookie?.value) {
            console.log(`Server-side: Found cookie ${cookieName}`);
            try {
              // Cookie might be JSON stringified
              const parsed = JSON.parse(cookie.value);
              authToken = parsed.access_token || parsed;
              break;
            } catch {
              // If not JSON, use as-is
              authToken = cookie.value;
              break;
            }
          }
        }
      }
      
      if (!authToken) {
        console.log('Server-side: No auth token found for private list');
        return NextResponse.json({ error: 'Authentication required for private list' }, { status: 401 });
      }
      
      // Create user client to verify the token and get user
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Try to get user from the token
      const { data: { user }, error: authError } = await userSupabase.auth.getUser(authToken);
      
      if (authError || !user) {
        console.log('Server-side: Invalid auth token for private list:', authError?.message);
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
      }
      
      // Check if user owns the list
      if (user.id !== list.user_id) {
        console.log('Server-side: User does not own private list');
        return NextResponse.json({ error: 'Access denied to private list' }, { status: 403 });
      }
      
      console.log('Server-side: User authenticated and owns private list');
    }
    
    // Fetch places for this list
    const { data: listPlaces, error: placesError } = await supabaseAdmin
      .from('list_places')
      .select(`
        *,
        places (*)
      `)
      .eq('list_id', id);
    
    if (placesError) {
      console.error('Server-side places error:', placesError);
      // Continue without places if there's an error
    }
    
    const response = {
      list,
      places: listPlaces || []
    };
    
    console.log('Server-side: Returning response with', listPlaces?.length || 0, 'places');
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Server-side API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 