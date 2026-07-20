/*
# Fix missing RLS policies blocking all data persistence

## Why
The app currently cannot persist ANY data to the database. Root causes:
1. profiles table has NO INSERT policy — when a user registers, the profile
   insert is silently blocked by RLS. No profile row is ever created.
2. Because no profile exists, downstream group creation fails (groups INSERT
   has no profile-dependent check, but group_members INSERT references the
   user, and moment_responses has no membership gate).
3. moments table has only a SELECT policy — INSERT/UPDATE/DELETE are missing,
   so admins cannot create or manage schedule moments.
4. moment_responses RLS only checks user_id = auth.uid() with NO membership
   check — any logged-in user can respond to ANY moment in ANY group, even
   groups they are not a member of.

## Changes

### 1. profiles INSERT policy
- Allow any authenticated user to INSERT their own profile row (id = auth.uid()).
- This is required for the registration flow: after supabase.auth.signUp()
  creates the auth.users row, the app inserts a matching profiles row.
- Scoped to own row only (WITH CHECK auth.uid() = id).

### 2. moments INSERT/UPDATE/DELETE policies
- INSERT: only group admins (or creators) can create moments for their group.
- UPDATE: only group admins can update moments.
- DELETE: only group admins can delete moments.
- All scoped via is_group_admin(group_id, auth.uid()) helper.

### 3. moment_responses — replace loose policy with membership-scoped policies
- DROP the existing FOR ALL policy (user_id = auth.uid() only, no membership).
- SELECT: users can view responses for moments in groups they are a member of.
- INSERT: users can respond only to moments in groups they are a member of.
- UPDATE: users can update only their own responses, and only for moments in
  groups they are a member of.
- DELETE: users can delete their own responses for moments in groups they are
  a member of.
- Membership checked via EXISTS subquery on group_members.

## Security
- No public/anon access — all policies TO authenticated.
- Profile INSERT scoped to own row.
- moments write operations scoped to group admin only.
- moment_responses scoped to group membership + own row.
- is_group_admin helper (SECURITY DEFINER) used for admin checks.

## Important notes
1. Idempotent — drops policies first.
2. No data is lost — only policy changes, no table/column changes.
3. The profiles INSERT policy is the critical fix: without it, registration
   silently fails and the entire app appears broken (no groups, no members,
   no moments persist).
*/

-- 1. profiles INSERT — allow users to create their own profile row
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- 2. moments INSERT — group admins only
DROP POLICY IF EXISTS "Group admins can create moments" ON moments;
CREATE POLICY "Group admins can create moments"
  ON moments FOR INSERT
  TO authenticated WITH CHECK (is_group_admin(group_id, auth.uid()));

-- moments UPDATE — group admins only
DROP POLICY IF EXISTS "Group admins can update moments" ON moments;
CREATE POLICY "Group admins can update moments"
  ON moments FOR UPDATE
  TO authenticated
  USING (is_group_admin(group_id, auth.uid()))
  WITH CHECK (is_group_admin(group_id, auth.uid()));

-- moments DELETE — group admins only
DROP POLICY IF EXISTS "Group admins can delete moments" ON moments;
CREATE POLICY "Group admins can delete moments"
  ON moments FOR DELETE
  TO authenticated USING (is_group_admin(group_id, auth.uid()));

-- 3. moment_responses — replace loose FOR ALL policy with membership-scoped CRUD

-- DROP the existing loose policy
DROP POLICY IF EXISTS "Users can manage own responses" ON moment_responses;

-- SELECT: view responses for moments in groups you are a member of
DROP POLICY IF EXISTS "Members can view moment responses" ON moment_responses;
CREATE POLICY "Members can view moment responses"
  ON moment_responses FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN moments m ON m.id = moment_responses.moment_id
      WHERE gm.group_id = m.group_id AND gm.user_id = auth.uid()
    )
  );

-- INSERT: respond only to moments in groups you are a member of (own row only)
DROP POLICY IF EXISTS "Members can create own responses" ON moment_responses;
CREATE POLICY "Members can create own responses"
  ON moment_responses FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_members gm
      JOIN moments m ON m.id = moment_responses.moment_id
      WHERE gm.group_id = m.group_id AND gm.user_id = auth.uid()
    )
  );

-- UPDATE: update only your own responses, for moments in groups you are a member of
DROP POLICY IF EXISTS "Members can update own responses" ON moment_responses;
CREATE POLICY "Members can update own responses"
  ON moment_responses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_members gm
      JOIN moments m ON m.id = moment_responses.moment_id
      WHERE gm.group_id = m.group_id AND gm.user_id = auth.uid()
    )
  );

-- DELETE: delete only your own responses, for moments in groups you are a member of
DROP POLICY IF EXISTS "Members can delete own responses" ON moment_responses;
CREATE POLICY "Members can delete own responses"
  ON moment_responses FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_members gm
      JOIN moments m ON m.id = moment_responses.moment_id
      WHERE gm.group_id = m.group_id AND gm.user_id = auth.uid()
    )
  );
