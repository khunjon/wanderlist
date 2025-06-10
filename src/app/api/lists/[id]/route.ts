import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('Server-side: Fetching list with ID:', id);
    
    // Use service role to bypass RLS for debugging
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
      // For now, just return 403 for private lists
      // In a full implementation, you'd check the user's auth token
      return NextResponse.json({ error: 'List is private' }, { status: 403 });
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