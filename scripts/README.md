# Database Cleanup Scripts

## Profile Photo Upload System (June 2025)

### ✅ Fixed Issues
The profile photo upload system has been completely overhauled and is now fully functional:

- **Storage Path Structure**: Fixed file path mismatch between upload function and storage policies
- **Next.js Image Optimization**: Added Supabase storage domain to allowed image domains  
- **Cache Busting**: Implemented automatic cache busting to ensure updated photos display immediately
- **Cross-Component Updates**: Profile photos now update instantly across navbar, profile page, and list author displays
- **Enhanced Error Handling**: Comprehensive logging and user-friendly error messages
- **Image Compression**: Improved compression algorithm that preserves PNG transparency

### Setup Requirements
1. **Storage Bucket**: Ensure `profile-photos` bucket exists in Supabase Storage
2. **Storage Policies**: Uncomment storage policies in `supabase-schema.sql` after creating bucket
3. **Next.js Config**: Add your Supabase storage domain to `next.config.js`

For detailed documentation, see [docs/features/profile-photo-upload.md](../docs/features/profile-photo-upload.md).

## Legacy Code Cleanup (June 2025)

### ✅ Completed Migration Cleanup
Removed unnecessary Firebase-to-Supabase migration compatibility layer:

- **Type System Simplification**: Cleaned up User and List types to remove dual naming conventions
- **Function Removal**: Removed legacy conversion functions (`convertToLegacyUser`, `convertToLegacyList`, etc.)
- **Code Modernization**: Updated all components to use clean Supabase property names
- **Build Optimization**: Reduced bundle size by removing unused compatibility code

The codebase now uses a clean, consistent type system without legacy Firebase compatibility.

## Duplicate Places Issue

### Problem
You may encounter the error: "Error: more than one row returned by a subquery used as an expression"

This happens when there are duplicate places in the database with the same `google_place_id`. While the database schema has a UNIQUE constraint on `google_place_id`, duplicates may exist due to:
- Data migration issues
- Race conditions during concurrent inserts
- Manual data imports

### Solution

1. **Code Fix (Already Applied)**
   - Modified `getPlaceByGoogleId()` function to use `.limit(1)` instead of `.single()`
   - Modified `isPlaceInList()` function to handle potential duplicates gracefully
   - These changes make the code more robust against duplicate data

2. **Database Cleanup**
   - Run the `cleanup-duplicate-places.sql` script in your Supabase SQL Editor
   - This script will:
     - Identify all duplicate places
     - Keep the oldest record for each `google_place_id`
     - Update all `list_places` references to point to the kept record
     - Delete the duplicate records

### How to Run the Cleanup

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `cleanup-duplicate-places.sql`
4. Run the script
5. The script will show you any duplicates found and clean them up

### Prevention

The code changes ensure that future operations will be more resilient to this issue, but to prevent duplicates from occurring:

1. Always use `upsertPlace()` instead of `createPlace()` when adding places
2. The `upsertPlace()` function now handles duplicates gracefully
3. Consider adding application-level checks before inserting places

### Verification

After running the cleanup script, you can verify the fix by:
1. Trying to add the same place to different lists (this should now work)
2. Running the verification query at the end of the cleanup script
3. Checking that no duplicate `google_place_id` values exist in the places table 