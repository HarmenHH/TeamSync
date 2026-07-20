/*
# Fix groups SELECT RLS: creators can see their own groups

## Problem
The `groups` SELECT policy only allowed seeing groups where the user is a
member (via `group_members`). When a user creates a new group, the
`groups` row is inserted first, then a `group_members` row is inserted
to make the creator an admin. But the `.select().single()` call in
`addGroup()` (which uses `INSERT ... RETURNING`) runs BEFORE the
membership row exists, so the SELECT policy filters out the newly
inserted row and PostgREST returns 0 rows. `.single()` then throws,
making it look like group creation failed for non-admin users.

## Fix
Add `OR created_by = auth.uid()` to the `groups` SELECT policy so the
creator can always see groups they created — including immediately
after INSERT, before the `group_members` row is added.

This does NOT leak groups to other users: Test 1 can only see groups
where `created_by = test1_id` OR where they have a `group_members` row.
They cannot see Admin's groups.

## Security
- Replaces the single `groups` SELECT policy (drop + recreate).
- No other policies changed.
*/

DROP POLICY IF EXISTS "Members can view their groups" ON groups;
CREATE POLICY "Members can view their groups"
ON groups FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR id IN (
    SELECT group_members.group_id
    FROM group_members
    WHERE group_members.user_id = auth.uid()
  )
);