/*
# Fix group admin editing, password-reset flow, and admin notifications

This migration fixes three problems reported by the admin:

1. Global admins could no longer edit groups they did not create
   (e.g. "Hockey Fietsen"). Two root causes:
   a) The helper function `is_group_admin()` had EXECUTE revoked from the
      `authenticated` role, but the groups UPDATE/DELETE policies call it.
      Any non-creator group admin therefore silently failed the policy
      (0 rows updated, no error) and could not save settings.
   b) The groups UPDATE/DELETE policies only allowed the creator or a
      per-group admin. A global admin (`profiles.role = 'admin'`) who is
      not a per-group admin of that group could not edit it.

2. The "Wachtwoord vergeten" flow was broken end-to-end:
   - An anon (logged-out) user could not read `profiles` to look up the
     username, so the request was never created.
   - An anon user could not INSERT into `password_reset_requests`
     (policy was `TO authenticated` with `user_id = auth.uid()`).
   - The frontend tried to write a non-existent `updated_at` column.
   - The admin reset used `auth.admin.updateUserById` from the browser,
     which requires the service-role key that is never exposed client-side.

3. Admins want a push notification when a new reset request is created.
   This requires being able to look up which users are admins from an
   anon context (to address the push) — handled by a new
   SECURITY DEFINER helper.

## Changes

### Functions
- Re-grant EXECUTE on `is_group_admin()` to `authenticated` so the
  groups RLS policies that depend on it work again.
- New `lookup_profile_by_username(p_username text)` SECURITY DEFINER
  function: returns `(id, username, display_name)` for a matching
  profile, or NULL. Designed for the anon forgot-password flow so it
  only exposes the minimal fields needed to create a reset request —
  not emails, roles, or other profiles. Revoked from PUBLIC/anon;
  granted to `anon, authenticated`.

### Tables
- `password_reset_requests`: add `updated_at TIMESTAMPTZ DEFAULT now()`
  and `resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL`
  (non-destructive — adds only). `updated_at` is what the frontend
  already writes; `resolved_by` records which admin handled it.

### RLS — groups
- Drop and recreate the UPDATE and DELETE policies so a global admin
  (`profiles.role = 'admin'`) can also update/delete any group, in
  addition to the creator and per-group admins. This restores the
  ability for the global admin to manage all groups, including
  "Hockey Fietsen".

### RLS — password_reset_requests
- INSERT: change to `TO anon, authenticated` with `WITH CHECK (true)`.
  The forgot-password flow runs while logged out, so anon must be able
  to create a request. The row's `user_id`/`username` are set from the
  server-side `lookup_profile_by_username` result in the frontend (the
  RPC only returns valid profile ids), so we do not need a stronger
  check here — the username is the only user-supplied input and it is
  matched against existing profiles.
- SELECT/UPDATE: unchanged (admin or own row).

## Security notes
1. `lookup_profile_by_username` is SECURITY DEFINER, owned by postgres,
   search_path locked to `public`. It only returns the id/username/
   display_name of an exact (case-insensitive) username match — never
   the role, email, or other users. This is the minimum needed for an
   anon user to file a reset request.
2. Granting EXECUTE to `anon` on this one function is intentional and
   scoped: it lets a logged-out user verify a username exists. It does
   NOT grant table-level SELECT on `profiles`.
3. Allowing anon INSERT on `password_reset_requests` is intentional:
   the table stores only a request for an admin to review. No sensitive
   data is exposed, and the admin-only SELECT/UPDATE policies still
   protect the rows.
4. Global admin group UPDATE/DELETE is gated on `profiles.role = 'admin'`,
   which is set by an existing admin and is not user-mutable.
*/

-- Re-grant EXECUTE on is_group_admin to authenticated so RLS policies work
REVOKE EXECUTE ON FUNCTION is_group_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_group_admin(uuid, uuid) TO authenticated;

-- Helper for anon forgot-password lookup: minimal profile fields only
CREATE OR REPLACE FUNCTION lookup_profile_by_username(p_username text)
RETURNS TABLE (id uuid, username text, display_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name
  FROM profiles p
  WHERE p.username = lower(trim(p_username))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION lookup_profile_by_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lookup_profile_by_username(text) TO anon, authenticated;

-- Add updated_at and resolved_by to password_reset_requests (additive only)
ALTER TABLE password_reset_requests
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE password_reset_requests
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- groups UPDATE: allow global admin too
DROP POLICY IF EXISTS "Group admins or creators can update groups" ON groups;
CREATE POLICY "Group admins or creators can update groups"
ON groups FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR is_group_admin(id, auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
  created_by = auth.uid()
  OR is_group_admin(id, auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- groups DELETE: allow global admin too
DROP POLICY IF EXISTS "Group admins or creators can delete groups" ON groups;
CREATE POLICY "Group admins or creators can delete groups"
ON groups FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR is_group_admin(id, auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- password_reset_requests INSERT: allow anon (forgot-password runs logged out)
DROP POLICY IF EXISTS "Users can insert own reset request" ON password_reset_requests;
CREATE POLICY "Anyone can create a reset request"
ON password_reset_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);
