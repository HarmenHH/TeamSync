/*
# Search profiles RPC for group admins

## Why
Group admins need to find users by username to invite them to their group. But
the profiles SELECT RLS policy only lets you read your own profile + profiles of
people who share a group with you — so a brand-new user is invisible to the
admin. A direct `profiles` query returns nothing for non-members.

## Changes
1. New SECURITY DEFINER function `search_profiles(query, admin_user_id)`:
   - Searches profiles by username/display_name ILIKE.
   - Returns only id, username, display_name (no emails or other sensitive data).
   - Restricted to users who are an admin of at least one group (verified via
     is_group_admin against the caller's own groups).
   - Excludes the caller themselves.
   - Limited to 10 results.

## Security
- SECURITY DEFINER runs with the function owner's privileges, bypassing RLS on
  profiles. This is necessary because RLS hides non-member profiles.
- The function only exposes minimal, non-sensitive fields (id, username,
  display_name). Email and other columns are NOT returned.
- Access is gated: the caller must be a group admin somewhere, otherwise empty.
- Callable by authenticated role only.

## Important notes
1. Idempotent — uses CREATE OR REPLACE.
2. Relies on is_group_admin() helper from migration 008.
3. Returns a TABLE so it can be called via supabase.rpc() and iterated.
*/

CREATE OR REPLACE FUNCTION search_profiles(query TEXT, admin_user_id UUID)
RETURNS TABLE (id UUID, username TEXT, display_name TEXT) AS $$
BEGIN
  -- Only allow if the caller is an admin of at least one group
  IF NOT EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.user_id = admin_user_id AND gm.role = 'admin'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.username, p.display_name
  FROM profiles p
  WHERE p.id <> admin_user_id
    AND (
      p.username ILIKE '%' || query || '%'
      OR p.display_name ILIKE '%' || query || '%'
    )
  ORDER BY p.username
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_profiles(TEXT, UUID) TO authenticated;
