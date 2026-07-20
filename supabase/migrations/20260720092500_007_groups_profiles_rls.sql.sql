/*
# Add CRUD policies for groups + profile editing

## Why
1. groups table has RLS enabled but only a SELECT policy (members can view their
   groups). Admins need INSERT/UPDATE/DELETE to create, rename, and delete groups.
   Currently addGroup/updateGroup/deleteGroup silently fail.
2. profiles table has only a SELECT policy (own row). Users need to UPDATE their
   own profile (display_name editing). Currently profile updates silently fail.

## Changes
1. groups INSERT: authenticated admins only.
2. groups UPDATE: authenticated admins only.
3. groups DELETE: authenticated admins only (or group creator).
4. profiles UPDATE: authenticated users can update their own row.

## Security
- Admin check via subquery: EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin').
- profiles UPDATE scoped to own row: auth.uid() = id.
- No public access.

## Important notes
1. Idempotent — drops policies first.
2. groups SELECT policy (members can view groups they belong to) is unchanged.
*/

-- groups INSERT (admin only)
DROP POLICY IF EXISTS "Admins can create groups" ON groups;
CREATE POLICY "Admins can create groups"
  ON groups FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- groups UPDATE (admin only)
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
CREATE POLICY "Admins can update groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- groups DELETE (admin only)
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;
CREATE POLICY "Admins can delete groups"
  ON groups FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- profiles UPDATE (own row only)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
