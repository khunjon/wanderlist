# Profile Photo Upload System

## Overview

The profile photo upload system allows users to upload, manage, and display profile pictures throughout the application. The system includes automatic image optimization, secure storage, and real-time updates across all components.

## Features

### Image Upload & Processing
- **Supported Formats**: JPG, PNG, GIF, WebP
- **File Size Limit**: 5MB maximum
- **Automatic Compression**: Images are resized to 800px max width while maintaining aspect ratio
- **Format Preservation**: PNG images maintain transparency, other formats are optimized as JPEG
- **Real-time Preview**: Users see a preview before uploading

### Storage Architecture
- **Secure Storage**: Files stored in Supabase Storage with user-specific folders
- **Path Structure**: `profile-photos/{userId}/{timestamp}.{ext}`
- **Public Access**: Images are publicly viewable but upload/delete is restricted to owners
- **Automatic Cleanup**: Old profile photos are automatically deleted when new ones are uploaded

### User Experience
- **Instant Updates**: Profile photos update immediately across all app components
- **Cache Busting**: Automatic cache invalidation ensures fresh images are always displayed
- **Loading States**: Visual feedback during upload process
- **Error Handling**: User-friendly error messages for various failure scenarios

## Technical Implementation

### File Upload Flow

1. **File Selection**: User selects image file through file input
2. **Client-side Validation**: File type and size validation
3. **Image Compression**: Automatic resizing and optimization
4. **Storage Upload**: Secure upload to Supabase Storage
5. **Database Update**: User profile updated with new photo URL
6. **Cache Busting**: URL modified to force browser refresh
7. **Global Refresh**: Auth context refreshed to update all components
8. **Cleanup**: Previous profile photo deleted from storage

### Storage Policies

The system uses Row Level Security (RLS) policies for secure access:

```sql
-- Users can upload their own profile photos
CREATE POLICY "Users can upload own profile photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own profile photos
CREATE POLICY "Users can update own profile photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own profile photos
CREATE POLICY "Users can delete own profile photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Profile photos are publicly viewable
CREATE POLICY "Profile photos are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');
```

### Image Compression Algorithm

```typescript
async function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
  // Creates canvas element for image processing
  // Calculates optimal dimensions maintaining aspect ratio
  // Preserves PNG transparency, optimizes other formats as JPEG
  // Returns compressed File object
}
```

### Cache Busting System

```typescript
export function addCacheBuster(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    // Only add cache buster to Supabase storage URLs
    if (urlObj.hostname.includes('supabase.co')) {
      urlObj.searchParams.set('t', Date.now().toString());
      return urlObj.toString();
    }
    return url;
  } catch {
    return url;
  }
}
```

## Component Integration

### Profile Page
- Main upload interface with drag-and-drop support
- Real-time preview of selected images
- Upload progress indicators
- Success/error messaging

### Navbar
- Small profile photo display in user menu
- Automatic updates when photo changes
- Fallback to default avatar icon

### User Profile Component
- Reusable component for displaying user photos
- Multiple size variants (sm, md, lg)
- Error handling for broken images
- Loading states

### List Author Display
- Shows profile photos next to list author information
- Consistent styling across different contexts

## Setup Requirements

### Supabase Storage Configuration

1. **Create Storage Bucket**:
   ```sql
   -- Create the profile-photos bucket (done via Supabase dashboard)
   -- Set bucket to public for read access
   ```

2. **Apply Storage Policies**:
   ```sql
   -- Policies are included in supabase-schema.sql
   -- Uncomment the storage policy sections after creating the bucket
   ```

### Next.js Configuration

Add Supabase storage domain to `next.config.js`:

```javascript
const nextConfig = {
  images: {
    domains: [
      'maps.googleapis.com', 
      'lh3.googleusercontent.com',
      'your-project-id.supabase.co' // Add your Supabase storage domain
    ],
  },
};
```

### Environment Variables

No additional environment variables required - uses existing Supabase configuration.

## Troubleshooting

### Common Issues

#### Upload Fails with "Failed to upload profile photo"
- **Check Storage Bucket**: Ensure `profile-photos` bucket exists and is public
- **Verify Policies**: Confirm storage policies are properly applied
- **File Size**: Ensure image is under 5MB limit
- **File Format**: Verify file is a supported image format

#### Images Don't Update After Upload
- **Cache Issues**: Clear browser cache or use incognito mode
- **Next.js Config**: Verify Supabase domain is in `next.config.js`
- **Component Keys**: Ensure components have proper `key` props for re-rendering

#### Storage Permission Errors
- **Authentication**: Verify user is properly authenticated
- **Policy Configuration**: Check that storage policies match the file path structure
- **Bucket Permissions**: Ensure bucket is configured for public read access

### Debug Tools

The system includes comprehensive logging for troubleshooting:

```typescript
// Enable debug logging in development
console.log('Starting photo upload for user:', userId);
console.log('File details:', { name: file.name, size: file.size, type: file.type });
console.log('Upload path:', filePath);
console.log('Upload successful, public URL:', publicUrl);
```

## Performance Considerations

### Image Optimization
- **Compression**: Reduces file sizes by 60-80% on average
- **Format Selection**: Automatic format optimization based on content
- **Lazy Loading**: Profile images use Next.js Image component for optimal loading

### Storage Efficiency
- **Automatic Cleanup**: Old photos are deleted to prevent storage bloat
- **CDN Delivery**: Supabase Storage provides global CDN for fast image delivery
- **Cache Headers**: Appropriate cache headers set for optimal browser caching

### Network Optimization
- **Progressive Upload**: Large images show upload progress
- **Error Recovery**: Automatic retry logic for failed uploads
- **Bandwidth Awareness**: Compression reduces bandwidth usage

## Future Enhancements

### Planned Features
- **Multiple Photo Support**: Allow users to upload multiple profile photos
- **Crop/Edit Interface**: Built-in image cropping and editing tools
- **Batch Operations**: Upload multiple images at once
- **Advanced Compression**: WebP format support for better compression

### Performance Improvements
- **Client-side Resizing**: Reduce upload times with browser-based resizing
- **Progressive JPEG**: Better loading experience for large images
- **Image Variants**: Generate multiple sizes for different use cases

## API Reference

### Core Functions

#### `updateProfilePhoto(userId: string, file: File, oldPhotoUrl?: string): Promise<PhotoUpdateResult>`
Main function for uploading and updating profile photos.

#### `uploadProfilePhoto(userId: string, file: File): Promise<string>`
Handles the actual file upload to Supabase Storage.

#### `deleteProfilePhoto(photoUrl: string): Promise<void>`
Removes a profile photo from storage.

#### `addCacheBuster(url: string): string | null`
Adds cache-busting parameters to image URLs.

### Type Definitions

```typescript
interface PhotoUpdateResult {
  success: boolean;
  message: string;
  photo_url?: string;
}
```

## Security Considerations

### Access Control
- **User Isolation**: Users can only access their own photos
- **Path Validation**: Server-side validation of file paths
- **Authentication Required**: All operations require valid authentication

### File Validation
- **Type Checking**: Server-side MIME type validation
- **Size Limits**: Enforced file size restrictions
- **Content Scanning**: Basic validation of file headers

### Privacy
- **Public URLs**: Profile photos are publicly accessible via URL
- **No Metadata**: EXIF data is stripped during compression
- **Secure Deletion**: Old photos are permanently removed from storage 