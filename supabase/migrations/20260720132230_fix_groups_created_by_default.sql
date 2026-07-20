/*
# Add default to groups.created_by

## Why
The `groups` SELECT policy now allows creators to see their own groups
via `created_by = auth.uid()`. If `created_by` is NULL (because an
insert omitted it), the creator can't see their own group. Adding
`DEFAULT auth.uid()` ensures the owner is always recorded from the
authenticated session, matching the bolt-database skill's mandatory
pattern for owner columns.

## Change
- `groups.created_by` gets `DEFAULT auth.uid()` (column is already
  nullable; we keep it nullable to avoid breaking existing rows with
  NULL, but new inserts get the authenticated user's ID automatically).
*/

ALTER TABLE groups
  ALTER COLUMN created_by SET DEFAULT auth.uid();