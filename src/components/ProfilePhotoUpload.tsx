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

  // Render as buttons for small size (traditional interface)
  if (size === 'sm') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Upload/Change button */}
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
          onClick={handleClick}
          disabled={isLoading}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
              </svg>
              {hasPhoto ? 'Change Photo' : 'Add Photo'}
            </>
          )}
        </button>

        {/* Delete button */}
        {hasPhoto && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-400 bg-transparent hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        )}

        {/* Error display */}
        {(uploadError || deleteError) && (
          <div className="mt-2 text-red-400 text-xs">
            {uploadError || deleteError}
          </div>
        )}
      </div>
    )
  }

  // Original drag-and-drop interface for md and lg sizes
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