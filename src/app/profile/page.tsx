'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useRequireAuth } from '@/hooks/useAuth';
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from '@/lib/firebase/user';
import { signOut } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/types';

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
          if (profile.photoURL) {
            setPreviewUrl(profile.photoURL);
          }
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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
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
      // Prepare update data
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

      // Upload photo if selected
      if (selectedFile) {
        try {
          // Show uploading status
          setSuccessMessage('Uploading photo... Please wait.');
          
          // Set a timeout to check if the upload is taking too long
          const timeoutId = setTimeout(() => {
            if (loading) {
              setError('The upload is taking longer than expected. Please wait or try again later with a smaller image.');
            }
          }, 10000);
          
          await uploadProfilePhoto(authUser.uid, selectedFile);
          
          // Clear the timeout if upload succeeds
          clearTimeout(timeoutId);
          setSuccessMessage('Profile updated successfully!');
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          setError('Failed to upload profile photo. Please try again with a smaller image or check your connection.');
          // Don't exit the function, we still updated other fields
        }
      } else {
        setSuccessMessage('Profile updated successfully!');
      }
      
      // Refresh user data
      const updatedProfile = await getUserProfile(authUser.uid);
      if (updatedProfile) {
        setUser(updatedProfile);
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
      // Navigation is handled in auth.ts with window.location.href
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Your Profile</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="bg-gray-800 px-4 py-5 shadow sm:rounded-lg sm:p-6">
            {error && (
              <div className="mb-4 bg-red-900 border-l-4 border-red-600 p-4">
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
              <div className="mb-4 bg-green-900 border-l-4 border-green-600 p-4">
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
              <div className="space-y-6">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-white">
                    Display Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="displayName"
                      id="displayName"
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-white">
                    Bio
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                      placeholder="Tell us about yourself (up to 500 characters)"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={loading}
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      {bio.length}/500 characters
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-white">
                    Instagram Username
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="instagram"
                      id="instagram"
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                      placeholder="@username (optional)"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tiktok" className="block text-sm font-medium text-white">
                    TikTok Username
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="tiktok"
                      id="tiktok"
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                      placeholder="@username (optional)"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white">Profile Photo</label>
                  <div className="mt-1 flex items-center space-x-6">
                    <div className="flex-shrink-0">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-700">
                        {previewUrl ? (
                          <Image
                            src={previewUrl}
                            alt="Profile"
                            className="h-full w-full object-cover"
                            width={96}
                            height={96}
                          />
                        ) : (
                          <svg
                            className="h-full w-full text-gray-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/gif"
                        className="hidden"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={handleSelectPhoto}
                        disabled={loading}
                      >
                        Change Photo
                      </button>
                      <p className="mt-2 text-xs text-gray-400">
                        JPG, PNG or GIF. Max 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/lists"
                    className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700"
                  >
                    Back to My Lists
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                  >
                    {loading ? 'Updating...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>

            {/* Account Actions Section */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Account Actions</h3>
              <div className="flex justify-start">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
      </main>
    </div>
  );
} 