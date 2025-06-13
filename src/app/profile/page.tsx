'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useRequireAuth } from '@/hooks/useAuth';
import { 
  getEnhancedUserProfile, 
  updateUserProfile, 
  updateProfilePhoto,
  validateProfileCompleteness,
  updateUserActivity
} from '@/lib/supabase/auth';
// import { testStorageUpload, getCurrentUserInfo } from '@/lib/debug/storage-test'; // Debug only
import { addCacheBuster } from '@/lib/utils/imageUtils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { EnhancedProfileData, ProfileUpdateResult, PhotoUpdateResult } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user: authUser, loading: authLoading, signOut, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<EnhancedProfileData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'friends'>('private');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<{
    is_complete: boolean;
    missing_fields: string[];
    completion_percentage: number;
  } | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the updated require auth hook with NavigationHandler
  const { NavigationHandler } = useRequireAuth();

  // Fetch enhanced user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) return;

      try {
        setError(null);
        setLoading(true);
        
        // Get enhanced profile with statistics
        const enhancedProfile = await getEnhancedUserProfile(authUser.id);
        if (enhancedProfile) {
          setProfile(enhancedProfile);
          setDisplayName(enhancedProfile.display_name || '');
          setBio(enhancedProfile.bio || '');
          setInstagram(enhancedProfile.instagram || '');
          setTiktok(enhancedProfile.tiktok || '');
          setProfileVisibility(enhancedProfile.profile_visibility as 'public' | 'private' | 'friends' || 'private');
          setEmailNotifications(enhancedProfile.email_notifications ?? true);
          setPushNotifications(enhancedProfile.push_notifications ?? true);
          // Set photo URL with cache busting for fresh loads
          setCurrentPhotoUrl(addCacheBuster(enhancedProfile.photo_url));
          setPreviewUrl(null); // Clear any preview
        }

        // Get profile completion status
        const completion = await validateProfileCompleteness(authUser.id);
        setProfileCompletion(completion);

        // Update user activity
        await updateUserActivity(authUser.id);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Could not load your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      fetchUserProfile();
    }
  }, [authUser]);



  // Handle profile update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!authUser) return;

    try {
      let photoUpdateResult: PhotoUpdateResult | null = null;

      // Upload photo first if selected
      if (selectedFile) {
        try {
          setUploadingPhoto(true);
          setSuccessMessage('Uploading photo... Please wait.');
          
          photoUpdateResult = await updateProfilePhoto(
            authUser.id, 
            selectedFile, 
            currentPhotoUrl || undefined
          );
          
          if (!photoUpdateResult.success) {
            throw new Error(photoUpdateResult.message);
          }
          
          // Update the current photo URL immediately with cache busting
          setCurrentPhotoUrl(addCacheBuster(photoUpdateResult.photo_url));
          setPreviewUrl(null); // Clear preview
          setSelectedFile(null); // Clear selected file
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          setError('Failed to upload profile photo. Please try again with a different image.');
          setLoading(false);
          setUploadingPhoto(false);
          return;
        } finally {
          setUploadingPhoto(false);
        }
      }

      // Prepare update data for other fields
      const updates: Parameters<typeof updateUserProfile>[1] = {};
      
      if (displayName !== profile?.display_name) {
        updates.displayName = displayName;
      }
      
      if (bio !== profile?.bio) {
        updates.bio = bio;
      }
      
      // Clean social media handles (remove @ if present)
      const cleanInstagram = instagram.replace('@', '').trim();
      const cleanTiktok = tiktok.replace('@', '').trim();
      
      if (cleanInstagram !== profile?.instagram) {
        updates.instagram = cleanInstagram || undefined;
      }
      
      if (cleanTiktok !== profile?.tiktok) {
        updates.tiktok = cleanTiktok || undefined;
      }

      if (profileVisibility !== profile?.profile_visibility) {
        updates.profileVisibility = profileVisibility;
      }

      if (emailNotifications !== profile?.email_notifications) {
        updates.emailNotifications = emailNotifications;
      }

      if (pushNotifications !== profile?.push_notifications) {
        updates.pushNotifications = pushNotifications;
      }

      // Update profile data if there are changes
      if (Object.keys(updates).length > 0) {
        const updateResult: ProfileUpdateResult = await updateUserProfile(authUser.id, updates);
        
        if (!updateResult.success) {
          throw new Error(updateResult.message);
        }
      }

      // Show success message
      let successMsg = 'Profile updated successfully!';
      if (photoUpdateResult?.success) {
        successMsg += ' Profile photo updated.';
      }
      setSuccessMessage(successMsg);
      
      // Refresh profile data
      const updatedProfile = await getEnhancedUserProfile(authUser.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
        // Update photo URL with cache busting if it changed
        if (photoUpdateResult?.photo_url) {
          setCurrentPhotoUrl(addCacheBuster(photoUpdateResult.photo_url));
        } else {
          setCurrentPhotoUrl(addCacheBuster(updatedProfile.photo_url));
        }
      }
      
      // Refresh the auth profile to update all components
      if (photoUpdateResult?.success) {
        await refreshProfile();
      }

      // Refresh profile completion status
      const completion = await validateProfileCompleteness(authUser.id);
      setProfileCompletion(completion);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  // Get the image URL to display (preview takes priority)
  const getDisplayImageUrl = () => {
    return previewUrl || currentPhotoUrl;
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo selection button
  const handleSelectPhoto = () => {
    fileInputRef.current?.click();
  };

  // Debug function to test storage
  const testStorage = async () => {
    // Debug logging removed for production
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHandler />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
                <p className="mt-2 text-blue-100">Manage your account and preferences</p>
              </div>
            </div>
          </div>

          {/* Profile Statistics */}
          {profile && (
            <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{profile.total_lists}</div>
                  <div className="text-sm text-gray-300">Total Lists</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{profile.public_lists}</div>
                  <div className="text-sm text-gray-300">Public Lists</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{profile.total_views}</div>
                  <div className="text-sm text-gray-300">Total Views</div>
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mx-6 mt-6">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mx-6 mt-6">
              {successMessage}
            </div>
          )}

          {/* Profile Form */}
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />

              {/* Profile Photo Section */}
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="relative">
                    {getDisplayImageUrl() ? (
                      <img
                        className="h-24 w-24 rounded-full object-cover ring-4 ring-gray-600"
                        src={getDisplayImageUrl()!}
                        alt="Profile"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-600 flex items-center justify-center ring-4 ring-gray-600">
                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-4">Profile Photo</h3>
                  <Button
                    type="button"
                    onClick={handleSelectPhoto}
                    disabled={loading || uploadingPhoto}
                    variant="secondary"
                    className="mb-2"
                  >
                    {uploadingPhoto ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                        </svg>
                        {getDisplayImageUrl() ? 'Change Photo' : 'Add Photo'}
                      </>
                    )}
                  </Button>
                  <p className="mt-2 text-xs text-gray-400">
                    JPG, PNG, GIF, or WebP. Max 5MB. Images will be automatically optimized.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="displayName" className="block text-sm font-medium text-white mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    id="displayName"
                    className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-12 px-4 transition-colors"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-white mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-4 transition-colors resize-none"
                    placeholder="Tell us about yourself (up to 1000 characters)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={loading}
                    maxLength={1000}
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                      Share a bit about yourself and your interests
                    </p>
                    <p className="text-xs text-gray-400">
                      {bio.length}/1000
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-white mb-2">
                    Instagram Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 sm:text-sm">@</span>
                    </div>
                    <input
                      type="text"
                      name="instagram"
                      id="instagram"
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-12 pl-8 pr-4 transition-colors"
                      placeholder="username"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tiktok" className="block text-sm font-medium text-white mb-2">
                    TikTok Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 sm:text-sm">@</span>
                    </div>
                    <input
                      type="text"
                      name="tiktok"
                      id="tiktok"
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-12 pl-8 pr-4 transition-colors"
                      placeholder="username"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profileVisibility" className="block text-sm font-medium text-white mb-2">
                    Profile Visibility
                  </label>
                  <select
                    id="profileVisibility"
                    name="profileVisibility"
                    className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-12 px-4 transition-colors"
                    value={profileVisibility}
                    onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'private' | 'friends')}
                    disabled={loading}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    Control who can see your profile and lists
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="emailNotifications"
                        name="emailNotifications"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        disabled={loading}
                      />
                      <label htmlFor="emailNotifications" className="ml-3 block text-sm text-white">
                        Email notifications
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="pushNotifications"
                        name="pushNotifications"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        disabled={loading}
                      />
                      <label htmlFor="pushNotifications" className="ml-3 block text-sm text-white">
                        Push notifications
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button type="submit" size="lg" disabled={loading || uploadingPhoto}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 