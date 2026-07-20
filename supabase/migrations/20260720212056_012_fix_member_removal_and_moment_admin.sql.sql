/*
# Fix silent failures in member removal and moment management

Two more RLS gaps of the same class as the group-edit bug:

## 1. Per-group admins could not remove members

The `group_members` DELETE policy ("Users can leave groups") only allowed
`user_id = auth.uid()` (self) or a global admin (`profiles.role = 'admin'`).
A per-group admin (group_members.role = 'admin' for that group) was NOT
allowed to delete another member's row. `removeMember` in AppContext
called `.delete().eq(...)` without checking row counts, so the delete
silently affected 0 rows; the UI optimistically removed the member from
local state, but they reappeared on the next reload.

Fix: add `is_group_admin(group_id, auth.uid())` to the DELETE USING
clause so per-group admins can remove members of their own groups.

## 2. Global admins could not edit/delete moments

The `moments` UPDATE and DELETE policies only allowed
`is_group_admin(group_id, auth.uid())`. A global admin who is not a
per-group admin of a group could not edit or delete that group's
moments — the exact same gap we just fixed for `groups`. A global
admin managing a group they did not create (e.g. "Hockey Fietsen")
could not manage its schedule.

Fix: add the `EXISTS (profiles.role = 'admin')` clause to both
policies, mirroring the groups UPDATE/DELETE policies.

These are policy-only changes; no data is touched.
*/

-- group_members DELETE: allow per-group admin to remove members
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups"
ON group_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR is_group_admin(group_id, auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- moments UPDATE: allow global admin too
DROP POLICY IF EXISTS "Group admins can update moments" ON moments;
CREATE POLICY "Group admins can update moments"
ON moments FOR UPDATE
TO authenticated
USING (
  is_group_admin(group_id, auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
  is_group_admin(group_id, auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- moments DELETE: allow global admin too
DROP POLICY IF EXISTS "Group admins can delete moments" ON moments;
CREATE POLICY "Group admins can delete moments"
ON moments FOR DELETE
TO authenticated
USING (
  is_group_admin(group_id, auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
