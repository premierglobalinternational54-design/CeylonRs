/*
# Fix profiles SELECT policy — eliminate RLS recursion

## Problem
The `select_own_profile` policy used `EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin)`.
Querying `profiles` inside a policy ON `profiles` causes RLS recursion — the subquery itself is subject
to RLS, which re-evaluates the same policy, potentially blocking reads.

## Fix
- Create a `SECURITY DEFINER` function `is_current_user_admin()` that bypasses RLS to check admin status.
- Rewrite the SELECT policy to use `auth.uid() = id OR is_current_user_admin()`.
- This also fixes admin access to other tables that use the same `EXISTS (SELECT FROM profiles...)` pattern.
*/

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$;

-- Fix profiles SELECT
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_current_user_admin());

-- Fix user_packages SELECT
DROP POLICY IF EXISTS "select_own_user_packages" ON user_packages;
CREATE POLICY "select_own_user_packages" ON user_packages FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix user_packages UPDATE
DROP POLICY IF EXISTS "update_own_user_packages" ON user_packages;
CREATE POLICY "update_own_user_packages" ON user_packages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix user_packages INSERT
DROP POLICY IF EXISTS "insert_own_user_packages" ON user_packages;
CREATE POLICY "insert_own_user_packages" ON user_packages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix user_packages DELETE
DROP POLICY IF EXISTS "delete_own_user_packages" ON user_packages;
CREATE POLICY "delete_own_user_packages" ON user_packages FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix mining_records SELECT
DROP POLICY IF EXISTS "select_own_mining_records" ON mining_records;
CREATE POLICY "select_own_mining_records" ON mining_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix claims SELECT
DROP POLICY IF EXISTS "select_own_claims" ON claims;
CREATE POLICY "select_own_claims" ON claims FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix payments SELECT
DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix activation_pins SELECT
DROP POLICY IF EXISTS "select_own_pins" ON activation_pins;
CREATE POLICY "select_own_pins" ON activation_pins FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix activation_pins INSERT
DROP POLICY IF EXISTS "insert_own_pins" ON activation_pins;
CREATE POLICY "insert_own_pins" ON activation_pins FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix activation_pins UPDATE
DROP POLICY IF EXISTS "update_own_pins" ON activation_pins;
CREATE POLICY "update_own_pins" ON activation_pins FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix referrals SELECT
DROP POLICY IF EXISTS "select_own_referrals" ON referrals;
CREATE POLICY "select_own_referrals" ON referrals FOR SELECT
  TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_current_user_admin());

-- Fix referrals UPDATE
DROP POLICY IF EXISTS "update_own_referrals" ON referrals;
CREATE POLICY "update_own_referrals" ON referrals FOR UPDATE
  TO authenticated USING (auth.uid() = referrer_id OR public.is_current_user_admin())
  WITH CHECK (auth.uid() = referrer_id OR public.is_current_user_admin());

-- Fix withdrawals SELECT
DROP POLICY IF EXISTS "select_own_withdrawals" ON withdrawals;
CREATE POLICY "select_own_withdrawals" ON withdrawals FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_current_user_admin());

-- Fix packages admin policies
DROP POLICY IF EXISTS "admin_insert_packages" ON packages;
CREATE POLICY "admin_insert_packages" ON packages FOR INSERT
  TO authenticated WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "admin_update_packages" ON packages;
CREATE POLICY "admin_update_packages" ON packages FOR UPDATE
  TO authenticated USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "admin_delete_packages" ON packages;
CREATE POLICY "admin_delete_packages" ON packages FOR DELETE
  TO authenticated USING (public.is_current_user_admin());

-- Fix payments admin UPDATE
DROP POLICY IF EXISTS "admin_update_payments" ON payments;
CREATE POLICY "admin_update_payments" ON payments FOR UPDATE
  TO authenticated USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Fix withdrawals admin UPDATE
DROP POLICY IF EXISTS "admin_update_withdrawals" ON withdrawals;
CREATE POLICY "admin_update_withdrawals" ON withdrawals FOR UPDATE
  TO authenticated USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Fix settings admin UPDATE
DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE
  TO authenticated USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());
