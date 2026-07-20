/*
# Align profiles & moment_responses schema with frontend

## Why
The frontend code (AuthContext, AccountScreen, MembersScreen, SamenDetail) uses:
- `profiles.display_name` (not `name`/`short`)
- `moment_responses.status` values 'aanwezig' / 'afwezig' (not 'join' / 'decline')

But the initial migration created `profiles.name`, `profiles.short` (both NOT NULL)
and a CHECK constraint limiting `moment_responses.status` to ('join','decline').
This mismatch breaks registration (insert of `display_name` fails) and breaks
responding to moments (insert of 'aanwezig'/'afwezig' violates CHECK).

## Changes
1. profiles table:
   - Add `display_name TEXT NOT NULL DEFAULT ''` (new column the frontend writes).
   - Backfill `display_name` from existing `name` for any rows present.
   - Drop NOT NULL on `name` and `short` so legacy inserts don't fail; keep columns
     for backward compatibility but they are no longer required.
2. moment_responses table:
   - Replace the CHECK constraint to allow 'aanwezig', 'afwezig', 'misschien',
     'join', 'decline' (Dutch values used by frontend + legacy English values).
3. password_reset_requests:
   - Already exists from 000_initial_schema. No changes needed.

## Security
- No RLS policy changes. Existing policies remain in effect.
- No new tables.

## Important notes
1. This migration is idempotent: re-running is safe.
2. `display_name` is the canonical display field going forward.
3. Frontend will keep using `display_name`; `name`/`short` are kept only to avoid
   data loss on any rows that might exist.
*/

-- 1. profiles: add display_name
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '';

-- Backfill display_name from name where display_name is empty
UPDATE profiles SET display_name = name WHERE display_name = '' AND name IS NOT NULL;

-- Relax NOT NULL on legacy columns so inserts that omit them succeed
ALTER TABLE profiles ALTER COLUMN name DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN short DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 2. moment_responses: replace status CHECK with Dutch + legacy values
ALTER TABLE moment_responses DROP CONSTRAINT IF EXISTS moment_responses_status_check;
ALTER TABLE moment_responses ADD CONSTRAINT moment_responses_status_check
  CHECK (status IN ('join', 'decline', 'aanwezig', 'afwezig', 'misschien'));
