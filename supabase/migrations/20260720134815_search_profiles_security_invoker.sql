-- Convert search_profiles to SECURITY INVOKER so the caller's RLS context
-- applies and the function is not a SECURITY DEFINER escalation surface.
--
-- Challenge: the function must search ALL profiles (to find users not yet
-- in the caller's group), but under RLS the invoker only sees profiles of
-- users in their own groups. To keep the elevated read minimal and safe,
-- we split it:
--   - _search_profiles_ids (SECURITY DEFINER, no public EXECUTE) returns
--     only (id, username, display_name) for matching profiles — no
--     privileged columns (email, role, etc.). It cannot be called via
--     REST by anon or authenticated.
--   - search_profiles (SECURITY INVOKER) verifies the caller is a group
--     admin using auth.uid() (not a trusted parameter), then delegates
--     the profile search to the helper. The admin check itself runs
--     under the invoker's RLS on group_members, which is fine because a
--     user can read their own membership rows.

CREATE OR REPLACE FUNCTION public._search_profiles_ids(query_text text)
RETURNS TABLE(id uuid, username text, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT p.id, p.username, p.display_name
  FROM profiles p
  WHERE p.username ILIKE '%' || query_text || '%'
     OR p.display_name ILIKE '%' || query_text || '%'
  ORDER BY p.username
  LIMIT 50;
$function$;
REVOKE EXECUTE ON FUNCTION public._search_profiles_ids(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_profiles(query text, admin_user_id uuid)
RETURNS TABLE(id uuid, username text, display_name text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Only allow if the caller is an admin of at least one group.
  -- Use auth.uid() rather than trusting the admin_user_id argument.
  IF admin_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT s.id, s.username, s.display_name
  FROM public._search_profiles_ids(query) AS s
  WHERE s.id <> auth.uid()
  ORDER BY s.username
  LIMIT 10;
END;
$function$;