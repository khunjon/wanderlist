import { useState, useCallback } from 'react'
import { uploadProfilePhoto, deleteProfilePhoto, getCacheBustedPhotoUrl } from '@/lib/supabase/storage'
import type { ProfilePhotoUploadResult, ProfilePhotoDeleteResult } from '@/lib/supabase/storage'

interface UseProfilePhotoReturn {
  isUploading: boolean
  isDeleting: boolean
  uploadError: string | null
  deleteError: string | null
  uploadPhoto: (userId: string, file: File, currentPhotoUrl?: string) => Promise<ProfilePhotoUploadResult>
  deletePhoto: (userId: string) => Promise<ProfilePhotoDeleteResult>
  getCacheBustedUrl: (photoUrl: string) => string
  clearErrors: () => void
}

export function useProfilePhoto(): UseProfilePhotoReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const uploadPhoto = useCallback(async (
    userId: string, 
    file: File, 
    currentPhotoUrl?: string
  ): Promise<ProfilePhotoUploadResult> => {
    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadProfilePhoto(userId, file, currentPhotoUrl)
      
      if (!result.success && result.error) {
        setUploadError(result.error)
      }
      
      return result
    } catch (error) {
      const errorMessage = 'An unexpected error occurred while uploading'
      setUploadError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsUploading(false)
    }
  }, [])

  const deletePhoto = useCallback(async (userId: string): Promise<ProfilePhotoDeleteResult> => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deleteProfilePhoto(userId)
      
      if (!result.success && result.error) {
        setDeleteError(result.error)
      }
      
      return result
    } catch (error) {
      const errorMessage = 'An unexpected error occurred while deleting'
      setDeleteError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsDeleting(false)
    }
  }, [])

  const clearErrors = useCallback(() => {
    setUploadError(null)
    setDeleteError(null)
  }, [])

  return {
    isUploading,
    isDeleting,
    uploadError,
    deleteError,
    uploadPhoto,
    deletePhoto,
    getCacheBustedUrl: getCacheBustedPhotoUrl,
    clearErrors
  }
} 