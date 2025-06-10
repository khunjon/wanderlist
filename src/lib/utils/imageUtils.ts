/**
 * Add cache busting parameter to image URLs
 */
export function addCacheBuster(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    // Only add cache buster to Supabase storage URLs
    if (urlObj.hostname.includes('supabase.co')) {
      urlObj.searchParams.set('t', Date.now().toString());
      return urlObj.toString();
    }
    return url;
  } catch {
    // If URL parsing fails, return original URL
    return url;
  }
}

/**
 * Remove cache busting parameter from image URLs for comparison
 */
export function removeCacheBuster(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('t');
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original URL
    return url;
  }
} 