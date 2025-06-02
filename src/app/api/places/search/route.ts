import { NextRequest, NextResponse } from 'next/server';
import { searchPlacesServer } from '@/lib/google/places';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const city = searchParams.get('city') || undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const data = await searchPlacesServer(query, city);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in places search API:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
} 