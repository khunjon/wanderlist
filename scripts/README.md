# Database Cleanup Scripts

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