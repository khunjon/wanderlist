import { supabase } from './client'
import { User, UserInsert, UserUpdate } from './client'
import type { AuthError, User as SupabaseUser } from '@supabase/supabase-js'
import type { 
  EnhancedUserProfile, 
  UserProfileInsert, 
  UserProfileUpdate,
  SocialLinks,
  UserPreferences 
} from '@/types/supabase'
import { trackEvent } from '@/lib/mixpanelClient'

// Auth state management
export interface AuthState {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  error: AuthError | null
}

// Enhanced profile data interface
export interface EnhancedProfileData extends EnhancedUserProfile {
  total_lists: number
  public_lists: number
  private_lists: number
  total_views: number
  engagement_score: number
}

// Profile update result interface
export interface ProfileUpdateResult {
  success: boolean
  message: string
  profile_data?: any
}

// Profile photo update result interface
export interface PhotoUpdateResult {
  success: boolean
  message: string
  photo_url?: string
}

// Profile validation result interface
export interface ProfileValidationResult {
  is_complete: boolean
  missing_fields: string[]
  completion_percentage: number
}

// Sign up with email and password
export async function signUp(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  if (error) {
    throw error
  }

  // Track signup event
  if (data.user) {
    trackEvent('User Signed Up', {
      provider: 'email',
      user_id: data.user.id,
      has_display_name: !!displayName
    });
  }

  return data
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

// Get the correct redirect URL for OAuth
function getRedirectUrl(): string {
  // Always prioritize environment variable first (works on both client and server)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Force production URL for placemarks.xyz
  if (typeof process !== 'undefined' && (
    process.env.VERCEL_URL?.includes('placemarks') || 
    (typeof window !== 'undefined' && window.location.hostname === 'placemarks.xyz')
  )) {
    return 'https://placemarks.xyz';
  }
  
  // Client-side dynamic detection (only for development)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    
    // If we're on localhost, use the current origin for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin;
    }
    
    // For production without env var, use current origin as fallback
    return origin;
  }
  
  // Server-side: Try to detect from headers (Vercel provides these)
  if (typeof process !== 'undefined' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Final fallback for development
  return 'http://localhost:3000';
}

// Sign in with Google OAuth
export async function signInWithGoogle() {
  const redirectUrl = getRedirectUrl();
  const fullRedirectUrl = `${redirectUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: fullRedirectUrl,
    },
  })

  if (error) {
    throw error
  }

  // Note: For OAuth, we can't track signup vs login here since the redirect happens
  // The actual tracking will happen in the auth state change handler
  // when we can determine if it's a new user or returning user

  return data
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
}

// Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw error
  }

  return user
}

// Get current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    throw error
  }

  return session
}

// Enhanced user profile management
export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw error
  }

  return data
}

// Get enhanced user profile with statistics
export async function getEnhancedUserProfile(userId: string): Promise<EnhancedProfileData | null> {
  const { data, error } = await supabase
    .rpc('get_enhanced_user_profile', { user_uuid: userId })

  if (error) {
    throw error
  }

  return (data as any)?.[0] || null
}

// Create user profile
export async function createUserProfile(profile: UserProfileInsert): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert(profile)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Enhanced profile update with validation
export async function updateUserProfile(
  userId: string, 
  updates: {
    displayName?: string
    bio?: string
    instagram?: string
    tiktok?: string
    photoURL?: string
    profileVisibility?: 'public' | 'private' | 'friends'
    timezone?: string
    languagePreference?: string
    emailNotifications?: boolean
    pushNotifications?: boolean
    socialLinks?: SocialLinks
    preferences?: UserPreferences
  }
): Promise<ProfileUpdateResult> {
  try {
    const updateData: any = {}
    
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName
    if (updates.bio !== undefined) updateData.bio = updates.bio
    if (updates.instagram !== undefined) updateData.instagram = updates.instagram
    if (updates.tiktok !== undefined) updateData.tiktok = updates.tiktok
    if (updates.photoURL !== undefined) updateData.photo_url = updates.photoURL
    if (updates.profileVisibility !== undefined) updateData.profile_visibility = updates.profileVisibility
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone
    if (updates.languagePreference !== undefined) updateData.language_preference = updates.languagePreference
    if (updates.emailNotifications !== undefined) updateData.email_notifications = updates.emailNotifications
    if (updates.pushNotifications !== undefined) updateData.push_notifications = updates.pushNotifications
    if (updates.socialLinks !== undefined) updateData.social_links = updates.socialLinks
    if (updates.preferences !== undefined) updateData.preferences = updates.preferences

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      profile_data: data
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update profile'
    }
  }
}

// Legacy update function for backward compatibility
export async function updateUserProfileLegacy(userId: string, updates: UserUpdate): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// Compress image utility function
async function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Determine output format based on original file type
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        const fileName = file.name.replace(/\.[^/.]+$/, '') + (outputType === 'image/png' ? '.png' : '.jpg')
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], fileName, {
                type: outputType,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Fallback to original file
            }
          },
          outputType,
          outputType === 'image/jpeg' ? quality : undefined
        )
      } catch (error) {
        console.error('Error in image compression:', error)
        resolve(file) // Fallback to original file
      }
    }
    
    img.onerror = () => {
      console.error('Error loading image for compression')
      resolve(file) // Fallback to original file
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Enhanced profile photo upload with compression and cleanup
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  try {
    console.log('Starting photo upload for user:', userId)
    console.log('Original file:', { name: file.name, size: file.size, type: file.type })
    
    // Compress image before upload
    const compressedFile = await compressImage(file, 800, 0.8)
    console.log('Compressed file:', { name: compressedFile.name, size: compressedFile.size, type: compressedFile.type })
    
    // Generate unique filename with proper extension
    const fileExt = compressedFile.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}` // Use userId folder structure for policies
    
    console.log('Upload path:', filePath)

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    console.log('Upload successful, public URL:', data.publicUrl)
    return data.publicUrl
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to upload profile photo. Please try again with a different image.')
  }
}

// Update profile photo with database sync
export async function updateProfilePhoto(
  userId: string, 
  file: File, 
  oldPhotoUrl?: string
): Promise<PhotoUpdateResult> {
  try {
    console.log('Starting profile photo update for user:', userId)
    console.log('File details:', { name: file.name, size: file.size, type: file.type })
    
    // Upload new photo
    const newPhotoUrl = await uploadProfilePhoto(userId, file)
    console.log('Photo uploaded successfully:', newPhotoUrl)
    
    // Update database directly
    const { data, error } = await supabase
      .from('users')
      .update({ 
        photo_url: newPhotoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    const result = { 
      success: true, 
      message: 'Profile photo updated successfully',
      photo_url: newPhotoUrl
    }
    
    // Clean up old photo if update was successful
    if (result.success && oldPhotoUrl && oldPhotoUrl !== newPhotoUrl) {
      try {
        console.log('Cleaning up old photo:', oldPhotoUrl)
        await deleteProfilePhoto(oldPhotoUrl)
      } catch (cleanupError) {
        console.warn('Failed to cleanup old profile photo:', cleanupError)
        // Don't fail the operation if cleanup fails
      }
    }
    
    return result
  } catch (error) {
    console.error('Error updating profile photo:', error)
    // Return a more specific error message based on the error type
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message
      }
    }
    return {
      success: false,
      message: 'Failed to upload profile photo. Please try again with a different image.'
    }
  }
}

// Delete profile photo
export async function deleteProfilePhoto(photoUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(photoUrl)
    const pathParts = url.pathname.split('/')
    // Find the profile-photos bucket part and get everything after it
    const bucketIndex = pathParts.findIndex(part => part === 'profile-photos')
    if (bucketIndex === -1) {
      throw new Error('Invalid photo URL format')
    }
    const filePath = pathParts.slice(bucketIndex + 1).join('/') // Get 'userId/filename'

    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      throw error
    }
  } catch (error) {
    console.error('Error deleting profile photo:', error)
    throw error
  }
}

// Validate profile completeness
export async function validateProfileCompleteness(userId: string): Promise<ProfileValidationResult> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('display_name, bio, photo_url, profile_completed')
      .eq('id', userId)
      .single()

    if (error) {
      throw error
    }

    const missingFields = []
    if (!data.display_name) missingFields.push('display_name')
    if (!data.bio) missingFields.push('bio')
    if (!data.photo_url) missingFields.push('photo_url')

    const completionPercentage = Math.round(((3 - missingFields.length) / 3) * 100)

    return {
      is_complete: missingFields.length === 0,
      missing_fields: missingFields,
      completion_percentage: completionPercentage
    }
  } catch (error) {
    return { is_complete: false, missing_fields: ['profile_not_found'], completion_percentage: 0 }
  }
}

// Update user activity timestamp
export async function updateUserActivity(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.warn('Failed to update user activity:', error)
    }
  } catch (error) {
    console.warn('Failed to update user activity:', error)
    // Don't throw error for activity updates
  }
}

// Reset password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    throw error
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw error
  }
}

// Auth event listeners
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// Check if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.is_admin || false
}

// Enhanced auth sync with optimized database function
export async function syncUserProfile(user: SupabaseUser): Promise<User> {
  try {
    // Use direct upsert instead of RPC
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
        photo_url: user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Note: We update last_active_at in the upsert above, so no need for separate updateUserActivity call

    // Return the profile data in the expected format
    return {
      id: data.id,
      email: data.email,
      display_name: data.display_name || '',
      photo_url: data.photo_url || '',
      is_admin: data.is_admin || false,
      bio: data.bio || '',
      instagram: data.instagram || '',
      tiktok: data.tiktok || '',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      profile_visibility: data.profile_visibility || 'private',
      profile_completed: data.profile_completed || false,
      timezone: data.timezone || 'UTC',
      language_preference: data.language_preference || 'en',
      email_notifications: data.email_notifications ?? true,
      push_notifications: data.push_notifications ?? true,
      last_active_at: data.last_active_at || new Date().toISOString(),
      social_links: data.social_links || {},
      preferences: data.preferences || {},
      metadata: data.metadata || {}
    }
  } catch (error) {
    console.error('Error syncing user profile:', error)
    throw error
  }
} 