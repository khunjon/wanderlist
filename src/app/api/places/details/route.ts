import { NextRequest, NextResponse } from 'next/server';
import { getPlaceDetailsServer } from '@/lib/google/places';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json(
        { error: 'placeId parameter is required' },
        { status: 400 }
      );
    }

    const data = await getPlaceDetailsServer(placeId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in place details API:', error);
    return NextResponse.json(
      { error: 'Failed to get place details' },
      { status: 500 }
    );
  }
} 