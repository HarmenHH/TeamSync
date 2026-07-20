/*
# Add invite_code column to groups

## Why
Groups currently only allow admin-invite joins (join_mode = 'admin'). We want
members to self-join using a short invite code that the admin generates and
shares. This adds the storage for that code.

## Changes
1. groups table:
   - Add `invite_code TEXT UNIQUE` (nullable; NULL = no self-join allowed).
   - Add `invite_code_updated_at TIMESTAMPTZ` to track when code was last regenerated.
2. No RLS changes needed — the existing SELECT policy on groups already lets
   members read their groups. Non-members cannot read the code because they
   cannot read the group row at all (SELECT policy requires membership).
   However, for joining we need non-members to verify a code. We solve this
   via a Postgres function `verify_invite_code` that checks the code without
   exposing other group data, callable with anon/authenticated.

## Security
- `verify_invite_code` is SECURITY DEFINER, returns only group id + name on
  correct code match (so the caller can confirm the group before joining).
- The actual group_members INSERT still goes through RLS (authenticated, own row).

## Important notes
1. Idempotent — uses ADD COLUMN IF NOT EXISTS and CREATE OR REPLACE.
2. Codes are 6 uppercase alphanumeric characters (A-Z, 0-9), ~36^6 possible.
*/

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_code_updated_at TIMESTAMPTZ;

-- Function: verify an invite code and return the group id + name
-- Used by the frontend before inserting a group_members row.
CREATE OR REPLACE FUNCTION verify_invite_code(input_code TEXT)
RETURNS TABLE (id UUID, name TEXT, emoji TEXT) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon + authenticated (pre-login join is not needed,
-- but keeping anon allows future public join flows)
GRANT EXECUTE ON FUNCTION verify_invite_code(TEXT) TO anon, authenticated;
