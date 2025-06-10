'use client'

import React, { useState, useEffect } from 'react'
import { ProfilePhotoUpload } from '../ProfilePhotoUpload'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@/lib/supabase/client'

interface ProfileSettingsExampleProps {
  userId: string
}

export function ProfileSettingsExample({ userId }: ProfileSettingsExampleProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')

  // Load user data
  useEffect(() => {
    async function loadUser() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error loading user:', error)
          return
        }

        setUser(data)
        setDisplayName(data.display_name || '')
        setBio(data.bio || '')
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [userId])

  // Handle photo update
  const handlePhotoUpdated = (newPhotoUrl: string) => {
    setUser(prev => prev ? { ...prev, photo_url: newPhotoUrl } : null)
  }

  // Handle photo deletion
  const handlePhotoDeleted = () => {
    setUser(prev => prev ? { ...prev, photo_url: '' } : null)
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error saving profile:', error)
        alert('Failed to save profile changes')
      } else {
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile changes')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load user profile
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Profile Settings</h2>
      
      {/* Profile Photo Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo
        </label>
        <div className="flex justify-center">
                     <ProfilePhotoUpload
             userId={userId}
             currentPhotoUrl={user.photo_url || undefined}
             onPhotoUpdated={handlePhotoUpdated}
             onPhotoDeleted={handlePhotoDeleted}
             size="lg"
           />
        </div>
      </div>

      {/* Display Name */}
      <div className="mb-4">
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your display name"
        />
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tell us about yourself..."
        />
        <div className="text-xs text-gray-500 mt-1">
          {bio.length}/500 characters
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveProfile}
        disabled={isSaving}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* Current Photo URL (for debugging) */}
      {user.photo_url && (
        <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <strong>Current photo URL:</strong>
          <br />
          <span className="break-all">{user.photo_url}</span>
        </div>
      )}
    </div>
  )
} 