import { NextRequest, NextResponse } from 'next/server';
import { getPlacePhotoServer } from '@/lib/google/places';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoReference = searchParams.get('photoReference');
    const maxWidth = searchParams.get('maxWidth') || '400';

    if (!photoReference) {
      return NextResponse.json(
        { error: 'photoReference parameter is required' },
        { status: 400 }
      );
    }

    const photoData = await getPlacePhotoServer(photoReference, parseInt(maxWidth));
    
    // Return the photo as a response with appropriate Content-Type
    return new NextResponse(photoData, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error in place photo API:', error);
    return NextResponse.json(
      { error: 'Failed to get place photo' },
      { status: 500 }
    );
  }
} 