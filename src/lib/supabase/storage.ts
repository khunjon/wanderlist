import { supabase } from './client'

export interface ProfilePhotoUploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface ProfilePhotoDeleteResult {
  success: boolean
  error?: string
}

/**
 * Generates a cache-busting filename for profile photos
 * This ensures browsers fetch the new image even if the path is the same
 */
function generateCacheBustingFilename(userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${userId}/avatar-${timestamp}-${random}.jpg`
}

/**
 * Extracts the file path from a Supabase storage URL
 */
function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const objectIndex = pathParts.findIndex(part => part === 'object')
    if (objectIndex !== -1 && pathParts[objectIndex + 1] === 'public') {
      return pathParts.slice(objectIndex + 3).join('/')
    }
    return null
  } catch {
    return null
  }
}

/**
 * Deletes old profile photos for a user
 * Keeps the storage clean by removing previous versions
 */
export async function deleteOldProfilePhotos(userId: string, currentPhotoUrl?: string): Promise<ProfilePhotoDeleteResult> {
  try {
    // List all files in the user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(`${userId}/`, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError) {
      console.error('Error listing files:', listError)
      return { success: false, error: listError.message }
    }

    if (!files || files.length === 0) {
      return { success: true }
    }

    // Get the current photo filename if we have a URL
    let currentPhotoFilename: string | null = null
    if (currentPhotoUrl) {
      const currentPath = extractFilePathFromUrl(currentPhotoUrl)
      if (currentPath) {
        currentPhotoFilename = currentPath.split('/').pop() || null
      }
    }

    // Filter out the current photo and prepare paths for deletion
    const filesToDelete = files
      .filter(file => file.name !== currentPhotoFilename)
      .map(file => `${userId}/${file.name}`)

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(filesToDelete)

      if (deleteError) {
        console.error('Error deleting old photos:', deleteError)
        return { success: false, error: deleteError.message }
      }

      console.log(`Deleted ${filesToDelete.length} old profile photos for user ${userId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteOldProfilePhotos:', error)
    return { success: false, error: 'Failed to delete old photos' }
  }
}

/**
 * Uploads a new profile photo with cache-busting and cleanup
 * This function handles the complete workflow:
 * 1. Upload new photo with unique filename
 * 2. Update user profile with new URL
 * 3. Clean up old photos
 */
export async function uploadProfilePhoto(
  userId: string, 
  file: File,
  currentPhotoUrl?: string
): Promise<ProfilePhotoUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' }
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 5MB' }
    }

    // Generate unique filename with cache-busting
    const filename = generateCacheBustingFilename(userId)

    // Upload the new photo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, file, {
        cacheControl: '3600', // 1 hour cache
        upsert: false // Always create new file for cache-busting
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get the public URL for the new photo
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename)

    const newPhotoUrl = urlData.publicUrl

    // Update user profile with new photo URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        photo_url: newPhotoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // If profile update fails, clean up the uploaded file
      await supabase.storage.from('avatars').remove([filename])
      return { success: false, error: updateError.message }
    }

    // Clean up old photos in the background (don't wait for this)
    deleteOldProfilePhotos(userId, newPhotoUrl).catch(error => {
      console.error('Background cleanup failed:', error)
      // Don't fail the main operation if cleanup fails
    })

    return { success: true, url: newPhotoUrl }
  } catch (error) {
    console.error('Error in uploadProfilePhoto:', error)
    return { success: false, error: 'Failed to upload profile photo' }
  }
}

/**
 * Deletes a user's profile photo and updates their profile
 */
export async function deleteProfilePhoto(userId: string): Promise<ProfilePhotoDeleteResult> {
  try {
    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('photo_url')
      .eq('id', userId)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    // Update profile to remove photo URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        photo_url: '',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Delete all photos for this user
    await deleteOldProfilePhotos(userId)

    return { success: true }
  } catch (error) {
    console.error('Error in deleteProfilePhoto:', error)
    return { success: false, error: 'Failed to delete profile photo' }
  }
}

/**
 * Gets a cache-busted URL for a profile photo
 * Adds a timestamp parameter to force browser refresh
 */
export function getCacheBustedPhotoUrl(photoUrl: string): string {
  if (!photoUrl) return photoUrl
  
  try {
    const url = new URL(photoUrl)
    url.searchParams.set('t', Date.now().toString())
    return url.toString()
  } catch {
    // If URL parsing fails, just append timestamp
    const separator = photoUrl.includes('?') ? '&' : '?'
    return `${photoUrl}${separator}t=${Date.now()}`
  }
}

/**
 * Creates the avatars bucket if it doesn't exist
 * Call this during app initialization
 */
export async function initializeAvatarsBucket(): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }

    const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars')

    if (!avatarsBucketExists) {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (createError) {
        console.error('Error creating avatars bucket:', createError)
      } else {
        console.log('Avatars bucket created successfully')
      }
    }
  } catch (error) {
    console.error('Error initializing avatars bucket:', error)
  }
} 