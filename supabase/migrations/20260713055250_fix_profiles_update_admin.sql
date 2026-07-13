-- ============================================================
-- Fix profiles UPDATE policy to allow admin updates
--
-- The update_own_profile policy only allowed auth.uid() = id, which blocks
-- admins from updating other users' wallet_balance during withdrawal approval.
-- Adding OR is_current_user_admin() so admins can deduct balances.
-- ============================================================

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_current_user_admin())
  WITH CHECK (auth.uid() = id OR public.is_current_user_admin());
