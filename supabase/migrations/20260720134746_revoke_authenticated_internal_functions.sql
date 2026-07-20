-- Remove authenticated EXECUTE on internal-only SECURITY DEFINER functions.
-- These three functions are never called from the frontend — only by
-- triggers (delete_user_data, handle_user_deletion) or inside RLS
-- policies (is_group_admin). Internal callers run with owner privileges
-- and bypass the EXECUTE check, so revoking authenticated is safe and
-- closes the /rest/v1/rpc/* escalation path.

REVOKE EXECUTE ON FUNCTION public.delete_user_data(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_deletion() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM authenticated;