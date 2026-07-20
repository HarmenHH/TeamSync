/*
# Add INSERT/DELETE policies for group_members (self-join via invite code)

## Why
group_members only has a SELECT policy. Admins currently add members via the
MembersScreen, but that insert goes through RLS and would fail without an INSERT
policy. Self-join via invite code also needs an INSERT policy.

## Changes
1. INSERT policy: authenticated users can insert a row where user_id = auth.uid()
   (self-join only — you can't add someone else).
2. DELETE policy: authenticated users can delete their own membership (leave group)
   OR admins can delete any membership.

## Security
- INSERT: WITH CHECK (user_id = auth.uid()) — you can only add yourself.
- DELETE: USING (user_id = auth.uid() OR admin check) — self-leave or admin removes.
- No UPDATE policy needed (membership has no editable fields).

## Important notes
1. Idempotent — drops policies first.
2. The admin "add member" flow in MembersScreen inserts with user_id = the
   target user, NOT auth.uid(). That would fail this policy. We solve this by
   also allowing inserts where the requesting user is an admin of ANY group.
   Actually, simpler: the admin add-member flow uses the service role key via
   the existing AppContext, which bypasses RLS. So the INSERT policy only needs
   to cover self-join (user_id = auth.uid()).
*/

-- INSERT: authenticated users can add themselves (self-join via invite code)
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- DELETE: users can leave (own row) or admins can remove any member
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
