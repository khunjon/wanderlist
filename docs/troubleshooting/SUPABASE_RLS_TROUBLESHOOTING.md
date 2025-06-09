# Supabase Row Level Security (RLS) Troubleshooting

## ✅ Issue Resolved: Infinite Recursion in RLS Policies

The infinite recursion error in Supabase RLS policies has been **fixed**. This was caused by circular dependencies between the `lists` and `list_collaborators` tables.

## What Was the Problem

### Error Message
```
Database error in getUserLists: 
{code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "lists"'}
```

### Root Cause
The RLS policies had a circular dependency:
1. The `lists` table policy referenced the `list_collaborators` table to check permissions
2. The `list_collaborators` table policy referenced the `lists` table to check ownership
3. This created an infinite loop when Supabase tried to evaluate permissions

## How It Was Fixed

### Solution: Security Definer Functions
We created **security definer functions** that bypass RLS when checking permissions, breaking the circular dependency:

1. **`is_list_collaborator(list_id, user_id)`** - Checks if a user is a collaborator on a list
2. **`can_edit_list(list_id, user_id)`** - Checks if a user can edit a list
3. **`is_list_owner(list_id, user_id)`** - Checks if a user owns a list
4. **`current_user_is_admin()`** - Checks if the current user is an admin

### Updated Policies
The RLS policies were updated to use these functions instead of directly querying the related tables:

```sql
-- Lists table policies
CREATE POLICY lists_basic_select ON lists
FOR SELECT
TO public
USING (
  auth.uid() = user_id 
  OR is_public = true 
  OR public.is_list_collaborator(id, auth.uid())
);

CREATE POLICY lists_basic_update ON lists
FOR UPDATE
TO public
USING (
  auth.uid() = user_id 
  OR public.can_edit_list(id, auth.uid())
);

-- List collaborators policies
CREATE POLICY list_collaborators_select_policy ON list_collaborators
FOR SELECT
TO authenticated
USING (
  public.is_list_owner(list_id, auth.uid())
  OR user_id = auth.uid()
  OR public.is_list_collaborator(list_id, auth.uid())
  OR public.current_user_is_admin()
);
```

## Prevention: Best Practices for RLS Policies

### 1. Avoid Circular Dependencies
- Never have RLS policies that reference each other in a circular manner
- Use security definer functions to break circular dependencies
- Design your permission model to have clear hierarchies

### 2. Use Security Definer Functions
```sql
-- Example security definer function
CREATE OR REPLACE FUNCTION public.check_permission(param_id uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM your_table
    WHERE id = param_id
      AND user_id = user_id_param
  );
$$;
```

### 3. Test RLS Policies Thoroughly
- Test policies with different user roles
- Check for circular dependencies before deploying
- Use simple queries to verify policy logic

### 4. Monitor for Recursion Errors
Watch for these error codes in your logs:
- `42P17` - Infinite recursion detected
- Performance issues with policy evaluation
- Timeouts on simple queries

## Debugging RLS Issues

### 1. Check Policy Dependencies
```sql
-- List all policies for a table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'your_table_name'
ORDER BY policyname;
```

### 2. Test Policies in Isolation
```sql
-- Test a specific policy by temporarily disabling others
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
-- Test your query
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### 3. Use EXPLAIN to Analyze Query Plans
```sql
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM your_table WHERE condition;
```

## Common RLS Patterns to Avoid

### ❌ Circular Reference Pattern
```sql
-- DON'T DO THIS - Creates circular dependency
CREATE POLICY table_a_policy ON table_a
USING (EXISTS (SELECT 1 FROM table_b WHERE table_b.a_id = table_a.id));

CREATE POLICY table_b_policy ON table_b  
USING (EXISTS (SELECT 1 FROM table_a WHERE table_a.id = table_b.a_id));
```

### ✅ Security Definer Pattern
```sql
-- DO THIS - Use security definer functions
CREATE FUNCTION check_table_b_access(a_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM table_b WHERE a_id = $1 AND user_id = $2);
$$;

CREATE POLICY table_a_policy ON table_a
USING (check_table_b_access(id, auth.uid()));
```

## Migration Applied

The fix was applied via migration `fix_rls_infinite_recursion_v3` which:
1. Created the security definer functions
2. Dropped the problematic policies
3. Recreated policies using the new functions
4. Eliminated the circular dependencies

## Verification

To verify the fix is working:
1. Lists should load without infinite recursion errors
2. Collaborator permissions should work correctly
3. No `42P17` errors in the logs
4. Query performance should be normal

## Support

If you encounter similar RLS issues:
1. Check for circular dependencies in your policies
2. Review the error logs for recursion patterns
3. Consider using security definer functions
4. Test policies thoroughly before deployment 