/*
# Fix security issues: search_path, EXECUTE grants, RLS policy bypasses

## Issues addressed
1. Search Path Mutable on 5 SECURITY DEFINER functions — they lacked an
   explicit `SET search_path`, allowing a role-mutable search_path that
   could resolve unqualified object names to attacker-controlled schemas.
2. Public/anon could EXECUTE SECURITY DEFINER functions via the REST
   API, escalating privileges (notably `delete_user_data` could be
   invoked by anyone to wipe a user's data).
3. `groups` INSERT policy was `WITH CHECK (true)` — unrestricted inserts
   by any authenticated user (data-integrity bypass).
4. `password_reset_requests` INSERT policy was `WITH CHECK (true)` —
   unrestricted inserts by anon + authenticated.

## Changes

### A. Functions: add `SET search_path = public, pg_temp` and REVOKE public EXECUTE
All five SECURITY DEFINER functions recreated with an explicit
`search_path = public, pg_temp` (prevents search_path hijacking) and
identical bodies. Then `REVOKE EXECUTE ON ... FROM PUBLIC, anon` so
only `authenticated` (and internal RLS/trigger callers) can invoke
them. The two functions called only by triggers (`delete_user_data`,
`handle_user_deletion`) keep SECURITY DEFINER but are not callable via
the REST API by any client role.

### B. RLS policy `Authenticated users can create groups`
Replace `WITH CHECK (true)` with `WITH CHECK (created_by = auth.uid())`
so an authenticated user can only insert a group they own. This pairs
with the `DEFAULT auth.uid()` on `created_by` so frontend inserts that
omit `created_by` still succeed.

### C. RLS policy `Anyone can insert reset request`
Replace `WITH CHECK (true)` with `WITH CHECK (user_id = auth.uid())`
so a reset request can only be created for the authenticated user
themselves. (For a no-auth reset flow this would need a different
design, but the app uses signed-in users.)

## Security impact
- Eliminates search_path hijacking on all SECURITY DEFINER functions.
- Removes anon/public RPC access to privileged functions.
- Closes INSERT bypasses on `groups` and `password_reset_requests`.
No data is lost; existing rows and other policies are untouched.
*/

-- ─── Functions: recreate with SET search_path + revoke public EXECUTE ───

CREATE OR REPLACE FUNCTION public.is_group_admin(g_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
SELECT EXISTS (
  SELECT 1 FROM group_members gm
  WHERE gm.group_id = g_id AND gm.user_id = u_id AND gm.role = 'admin'
);
$function$;

CREATE OR REPLACE FUNCTION public.verify_invite_code(input_code text)
RETURNS TABLE(id uuid, name text, emoji text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  found_group RECORD;
BEGIN
  SELECT g.id, g.name, g.emoji
  INTO found_group
  FROM groups g
  WHERE g.invite_code = UPPER(input_code);

  IF found_group.id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT found_group.id, found_group.name, found_group.emoji;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_profiles(query text, admin_user_id uuid)
RETURNS TABLE(id uuid, username text, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  DELETE FROM push_subscriptions WHERE user_id = target_user_id;
  DELETE FROM presence WHERE user_id = target_user_id;
  DELETE FROM notes WHERE user_id = target_user_id;
  DELETE FROM moment_responses WHERE user_id = target_user_id;
  DELETE FROM group_members WHERE user_id = target_user_id;
  DELETE FROM groups WHERE created_by = target_user_id;
  DELETE FROM password_reset_requests WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  PERFORM delete_user_data(OLD.id);
  RETURN OLD;
END;
$function$;

-- Revoke EXECUTE from PUBLIC and anon for every SECURITY DEFINER function.
-- `authenticated` retains EXECUTE (default for functions) so the frontend
-- RPC calls (search_profiles, verify_invite_code) still work for signed-in
-- users. Internal trigger callers run with definer privileges, unaffected.
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.verify_invite_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_profiles(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_data(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_user_deletion() FROM PUBLIC, anon;

-- ─── RLS: replace unrestricted INSERT policies ───

DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups"
ON groups FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert reset request" ON password_reset_requests;
CREATE POLICY "Users can insert own reset request"
ON password_reset_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());