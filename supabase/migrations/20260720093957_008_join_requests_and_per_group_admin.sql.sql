/*
# Join requests + per-group admin RLS

## Why
The app currently has two problems:
1. Group management (create, settings, add members) is gated on a GLOBAL admin
   role (profiles.role = 'admin'). But the product wants EVERY user to be able
   to create a group and automatically become the admin OF THAT GROUP — with no
   global admin role required.
2. Joining a group is only possible via an invite code (instant join). The
   product also wants a "request to join" flow where a user asks to join and the
   group's admin approves or declines.

## Changes

### 1. New table: join_requests
- id (uuid pk)
- group_id (fk -> groups, cascade delete)
- user_id (fk -> profiles, cascade delete)
- status (text: 'pending' | 'approved' | 'declined', default 'pending')
- created_at (timestamptz default now())
- reviewed_at (timestamptz, nullable)
- UNIQUE(group_id, user_id) — one active request per user per group

### 2. RLS: groups INSERT/UPDATE/DELETE
- INSERT: any authenticated user can create a group (they become the creator).
- UPDATE: only the group's creator OR a group_admin (group_members.role='admin'
  for that group) can update.
- DELETE: only the group's creator OR a group_admin.

### 3. RLS: group_members INSERT
- Keep self-join (user_id = auth.uid()) for invite-code joins.
- ALSO allow group admins to insert members for their group.

### 4. RLS: group_members UPDATE
- Allow a group admin to update member roles within their group.

### 5. RLS: join_requests
- SELECT: own requests + group admins see all requests for their groups.
- INSERT: authenticated users create a request for themselves only.
- UPDATE: only group admins can update status (approve/decline).
- DELETE: self-delete own request.

## Security
- All admin checks use group_members.role = 'admin' for the specific group,
  scoped to auth.uid(). No global admin role is used for group management.
- No public/anon access — all policies are TO authenticated.

## Important notes
1. Idempotent — drops policies first, uses IF NOT EXISTS for the table.
2. No data is lost — only policy changes + a new table.
*/

-- 1. join_requests table
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(group_id, user_id)
);

ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- Helper: is the given user an admin of the given group?
CREATE OR REPLACE FUNCTION is_group_admin(g_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = g_id AND gm.user_id = u_id AND gm.role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. groups INSERT — any authenticated user can create a group
DROP POLICY IF EXISTS "Admins can create groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated WITH CHECK (true);

-- groups UPDATE — creator or group admin
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Group admins or creators can update groups" ON groups;
CREATE POLICY "Group admins or creators can update groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR is_group_admin(id, auth.uid()))
  WITH CHECK (created_by = auth.uid() OR is_group_admin(id, auth.uid()));

-- groups DELETE — creator or group admin
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;
DROP POLICY IF EXISTS "Group admins or creators can delete groups" ON groups;
CREATE POLICY "Group admins or creators can delete groups"
  ON groups FOR DELETE
  TO authenticated USING (created_by = auth.uid() OR is_group_admin(id, auth.uid()));

-- 3. group_members INSERT — self-join OR group admin adding a member
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR is_group_admin(group_id, auth.uid())
  );

-- 4. group_members UPDATE — group admin can change roles
DROP POLICY IF EXISTS "Group admins can update members" ON group_members;
CREATE POLICY "Group admins can update members"
  ON group_members FOR UPDATE
  TO authenticated
  USING (is_group_admin(group_id, auth.uid()))
  WITH CHECK (is_group_admin(group_id, auth.uid()));

-- 5. join_requests policies
DROP POLICY IF EXISTS "Users can view own or group join requests" ON join_requests;
CREATE POLICY "Users can view own or group join requests"
  ON join_requests FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR is_group_admin(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create join requests" ON join_requests;
CREATE POLICY "Users can create join requests"
  ON join_requests FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Group admins can update join requests" ON join_requests;
CREATE POLICY "Group admins can update join requests"
  ON join_requests FOR UPDATE
  TO authenticated
  USING (is_group_admin(group_id, auth.uid()))
  WITH CHECK (is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS "Users can delete own join requests" ON join_requests;
CREATE POLICY "Users can delete own join requests"
  ON join_requests FOR DELETE
  TO authenticated USING (user_id = auth.uid());
