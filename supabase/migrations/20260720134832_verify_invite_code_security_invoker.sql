-- Convert verify_invite_code to SECURITY INVOKER.
--
-- The function looks up a group by its invite code so a non-member can
-- join. Under RLS the invoker cannot see groups they aren't in, so the
-- lookup is delegated to a SECURITY DEFINER helper that returns only the
-- public fields needed to join (id, name, emoji) — no privileged data
-- such as created_by or member lists. The helper cannot be called via
-- REST by anon or authenticated.

CREATE OR REPLACE FUNCTION public._lookup_group_by_invite_code(input_code text)
RETURNS TABLE(id uuid, name text, emoji text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT g.id, g.name, g.emoji
  FROM groups g
  WHERE g.invite_code = UPPER(input_code);
$function$;
REVOKE EXECUTE ON FUNCTION public._lookup_group_by_invite_code(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_invite_code(input_code text)
RETURNS TABLE(id uuid, name text, emoji text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
BEGIN
  -- Require a signed-in caller; anon cannot join groups.
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT g.id, g.name, g.emoji
  FROM public._lookup_group_by_invite_code(input_code) AS g;
END;
$function$;