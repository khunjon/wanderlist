'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useRequireAuth } from '@/hooks/useAuth';
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from '@/lib/firebase/user';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/types';

// Image compression utility
const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = (width * maxWidth) / height;
          height = maxWidth;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the updated require auth hook with NavigationHandler
  const { NavigationHandler } = useRequireAuth();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) return;

      try {
        setLoading(true);
        const profile = await getUserProfile(authUser.uid);
        if (profile) {
          setUser(profile);
          setDisplayName(profile.displayName);
          setBio(profile.bio || '');
          setInstagram(profile.instagram || '');
          setTiktok(profile.tiktok || '');
          setCurrentPhotoUrl(profile.photoURL || null);
          setPreviewUrl(null); // Clear any preview
        }
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

  // Handle file selection with compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    setError(null);
    setUploadingPhoto(true);

    try {
      let processedFile = file;
      
      // Compress if file is larger than 1MB or dimensions are too large
      if (file.size > 1024 * 1024 || file.type !== 'image/gif') {
        processedFile = await compressImage(file, 800, 0.8);
      }

      // Final size check after compression
      if (processedFile.size > 5 * 1024 * 1024) {
        setError('Image is still too large after compression. Please try a smaller image.');
        setUploadingPhoto(false);
        return;
      }

      setSelectedFile(processedFile);

      // Create preview URL for immediate feedback
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
      setUploadingPhoto(false);
    }
  };

  // Trigger file input click
  const handleSelectPhoto = () => {
    fileInputRef.current?.click();
  };

  // Handle profile update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!authUser) return;

    // Validate bio length
    if (bio.length > 500) {
      setError('Bio must be 500 characters or less');
      setLoading(false);
      return;
    }

    // Validate social media handles (remove @ if present and validate format)
    const cleanInstagram = instagram.replace('@', '').trim();
    const cleanTiktok = tiktok.replace('@', '').trim();
    
    if (cleanInstagram && !/^[a-zA-Z0-9._]{1,30}$/.test(cleanInstagram)) {
      setError('Instagram username can only contain letters, numbers, periods, and underscores (max 30 characters)');
      setLoading(false);
      return;
    }
    
    if (cleanTiktok && !/^[a-zA-Z0-9._]{1,24}$/.test(cleanTiktok)) {
      setError('TikTok username can only contain letters, numbers, periods, and underscores (max 24 characters)');
      setLoading(false);
      return;
    }

    try {
      // Upload photo first if selected
      if (selectedFile) {
        try {
          setSuccessMessage('Uploading photo... Please wait.');
          const newPhotoURL = await uploadProfilePhoto(authUser.uid, selectedFile);
          console.log('Photo uploaded successfully, new URL:', newPhotoURL);
          
          // Update the current photo URL immediately
          setCurrentPhotoUrl(newPhotoURL);
          setPreviewUrl(null); // Clear preview
          setSelectedFile(null); // Clear selected file
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          setError('Failed to upload profile photo. Please try again with a different image.');
          setLoading(false);
          return;
        }
      }

      // Prepare update data for other fields
      const updateData: Partial<User> = {};
      
      if (displayName !== user?.displayName) {
        updateData.displayName = displayName;
      }
      
      if (bio !== user?.bio) {
        updateData.bio = bio;
      }
      
      if (cleanInstagram !== user?.instagram) {
        updateData.instagram = cleanInstagram || undefined;
      }
      
      if (cleanTiktok !== user?.tiktok) {
        updateData.tiktok = cleanTiktok || undefined;
      }

      // Update profile data if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateUserProfile(authUser.uid, updateData);
      }

      setSuccessMessage('Profile updated successfully!');
      
      // Refresh user data
      const updatedProfile = await getUserProfile(authUser.uid);
      if (updatedProfile) {
        setUser(updatedProfile);
        // Only update photo URL if it's different from what we have
        if (updatedProfile.photoURL && updatedProfile.photoURL !== currentPhotoUrl) {
          setCurrentPhotoUrl(updatedProfile.photoURL);
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
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
      
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Your Profile</h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-4xl py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 shadow sm:rounded-lg">
            <div className="px-4 py-6 sm:p-8">
              {error && (
                <div className="mb-6 bg-red-900 border-l-4 border-red-600 p-4 rounded-r-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 bg-green-900 border-l-4 border-green-600 p-4 rounded-r-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-300">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-8">
                  {/* Profile Photo Section */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="relative h-32 w-32 mx-auto rounded-full overflow-hidden bg-gray-700 ring-4 ring-gray-600">
                        {getDisplayImageUrl() ? (
                          <img
                            src={getDisplayImageUrl()!}
                            alt="Profile"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', getDisplayImageUrl());
                              // Hide the broken image
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        
                        {/* Default avatar - always present as fallback */}
                        <div className={`absolute inset-0 flex items-center justify-center ${getDisplayImageUrl() ? 'hidden' : ''}`}>
                          <svg
                            className="h-16 w-16 text-gray-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>

                        {uploadingPhoto && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        disabled={loading || uploadingPhoto}
                      />
                      
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                        onClick={handleSelectPhoto}
                        disabled={loading || uploadingPhoto}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition-colors"
                        onClick={handleSelectPhoto}
                        disabled={loading || uploadingPhoto}
                      >
                        {uploadingPhoto ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {getDisplayImageUrl() ? 'Change Photo' : 'Add Photo'}
                          </>
                        )}
                      </button>
                      <p className="mt-2 text-xs text-gray-400">
                        JPG, PNG, GIF, or WebP. Images will be automatically optimized.
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="displayName" className="block text-sm font-medium text-white mb-2">
                        Display Name
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
                        placeholder="Tell us about yourself (up to 500 characters)"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        disabled={loading}
                        maxLength={500}
                      />
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-xs text-gray-400">
                          Share a bit about yourself and your interests
                        </p>
                        <p className="text-xs text-gray-400">
                          {bio.length}/500
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
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                    <Link
                      href="/lists"
                      className="inline-flex justify-center items-center px-6 py-3 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-transparent hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
                    >
                      Back to My Lists
                    </Link>
                    <button
                      type="submit"
                      disabled={loading || uploadingPhoto}
                      className="inline-flex justify-center items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Account Actions Section */}
              <div className="mt-12 pt-8 border-t border-gray-700">
                <h3 className="text-lg font-medium text-white mb-6">Account Actions</h3>
                <div className="flex justify-start">
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 