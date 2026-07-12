/*
# Fix profiles UPDATE policy — remove recursive EXISTS

## Problem
The `update_own_profile` policy used `EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)`
in both USING and WITH CHECK. This subquery on `profiles` during an UPDATE on `profiles` can trigger
RLS recursion issues, causing updates to fail silently for regular users.

## Fix
- Simplify to `auth.uid() = id` only — users can update their own row.
- Admins don't need to update profiles directly (they manage payments, withdrawals, pins, etc.).
*/

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
