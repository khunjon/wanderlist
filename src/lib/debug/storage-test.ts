import { supabase } from '../supabase/client'

export async function testStorageUpload(userId: string) {
  try {
    console.log('Testing storage upload for user:', userId)
    
    // Create a simple test file
    const testContent = 'test-image-content'
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
    const filePath = `${userId}/test-${Date.now()}.txt`
    
    console.log('Test file path:', filePath)
    
    // Test upload
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, testFile, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Storage test upload error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Storage test upload success:', data)
    
    // Test getting public URL
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)
    
    console.log('Public URL:', urlData.publicUrl)
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('profile-photos')
      .remove([filePath])
    
    if (deleteError) {
      console.warn('Failed to clean up test file:', deleteError)
    }
    
    return { 
      success: true, 
      publicUrl: urlData.publicUrl,
      uploadData: data 
    }
    
  } catch (error) {
    console.error('Storage test error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getCurrentUserInfo() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error)
      return { success: false, error: error.message }
    }
    
    if (!user) {
      console.log('No authenticated user')
      return { success: false, error: 'No authenticated user' }
    }
    
    console.log('Current user:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    })
    
    return { success: true, user }
    
  } catch (error) {
    console.error('Error getting user info:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
} 