/*
# Add RLS policies for password_reset_requests

## Why
The password_reset_requests table (from 000_initial_schema) has RLS enabled but
NO policies, so it is completely locked. The "Wachtwoord vergeten" flow needs:
- Any authenticated OR unauthenticated user can INSERT a reset request (they enter
  their username before logging in).
- Admins can SELECT and UPDATE requests to review and resolve them.
- Users can read their own requests (optional, for status checking).

## Changes
1. INSERT policy: allow anyone (anon + authenticated) to insert a reset request.
   This is intentionally public because the user is not logged in when requesting.
2. SELECT policy: admins can see all requests; a user can see their own.
3. UPDATE policy: admins can update status (e.g. mark resolved).

## Security
- INSERT is public (required for the forgot-password flow pre-login).
- SELECT/UPDATE restricted to admins or own row.
- No DELETE policy (requests are kept for audit; admin updates status instead).

## Important notes
1. Admin check uses a subquery: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin').
2. Idempotent: drops policies first.
*/

-- INSERT: anyone can request a password reset (pre-login flow)
DROP POLICY IF EXISTS "Anyone can insert reset request" ON password_reset_requests;
CREATE POLICY "Anyone can insert reset request"
  ON password_reset_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- SELECT: admins see all; users see their own
DROP POLICY IF EXISTS "Admins can view all reset requests" ON password_reset_requests;
CREATE POLICY "Admins can view all reset requests"
  ON password_reset_requests FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- UPDATE: admins can update status
DROP POLICY IF EXISTS "Admins can update reset requests" ON password_reset_requests;
CREATE POLICY "Admins can update reset requests"
  ON password_reset_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
