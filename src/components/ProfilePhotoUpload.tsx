'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useProfilePhoto } from '@/hooks/useProfilePhoto'

interface ProfilePhotoUploadProps {
  userId: string
  currentPhotoUrl?: string
  onPhotoUpdated?: (newPhotoUrl: string) => void
  onPhotoDeleted?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24', 
  lg: 'w-32 h-32'
}

export function ProfilePhotoUpload({
  userId,
  currentPhotoUrl,
  onPhotoUpdated,
  onPhotoDeleted,
  className = '',
  size = 'md'
}: ProfilePhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
    isUploading,
    isDeleting,
    uploadError,
    deleteError,
    uploadPhoto,
    deletePhoto,
    getCacheBustedUrl,
    clearErrors
  } = useProfilePhoto()

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return

    // Create preview
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)

    // Upload the file
    const result = await uploadPhoto(userId, file, currentPhotoUrl)
    
    if (result.success && result.url) {
      onPhotoUpdated?.(result.url)
      // Clear preview after successful upload
      URL.revokeObjectURL(preview)
      setPreviewUrl(null)
    } else {
      // Keep preview on error so user can try again
      console.error('Upload failed:', result.error)
    }
  }, [userId, currentPhotoUrl, uploadPhoto, onPhotoUpdated])

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    clearErrors()

    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }, [handleFileSelect, clearErrors])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleClick = useCallback(() => {
    clearErrors()
    fileInputRef.current?.click()
  }, [clearErrors])

  const handleDelete = useCallback(async () => {
    if (!currentPhotoUrl) return

    const result = await deletePhoto(userId)
    if (result.success) {
      onPhotoDeleted?.()
    }
  }, [userId, currentPhotoUrl, deletePhoto, onPhotoDeleted])

  const displayPhotoUrl = previewUrl || (currentPhotoUrl ? getCacheBustedUrl(currentPhotoUrl) : null)
  const hasPhoto = Boolean(displayPhotoUrl)
  const isLoading = isUploading || isDeleting

  return (
    <div className={`relative ${className}`}>
      {/* Main upload area */}
      <div
        className={`
          ${sizeClasses[size]} 
          relative rounded-full border-2 border-dashed cursor-pointer
          transition-all duration-200 overflow-hidden
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!isLoading ? handleClick : undefined}
      >
        {hasPhoto && displayPhotoUrl ? (
          <img
            src={displayPhotoUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Delete button */}
      {hasPhoto && !isLoading && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
          title="Delete photo"
        >
          ×
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Error messages */}
      {(uploadError || deleteError) && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {uploadError || deleteError}
        </div>
      )}

      {/* Help text */}
      {!hasPhoto && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 text-center text-xs text-gray-500">
          Click or drag to upload
        </div>
      )}
    </div>
  )
} 