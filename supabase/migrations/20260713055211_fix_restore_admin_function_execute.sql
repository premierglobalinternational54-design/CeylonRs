-- ============================================================
-- Fix: Restore is_current_user_admin() EXECUTE for authenticated role
--
-- The previous migration (fix_security_issues) revoked EXECUTE from both
-- anon AND authenticated. But is_current_user_admin() is used inside RLS
-- policy expressions on nearly every table (profiles, user_packages, claims,
-- payments, withdrawals, packages, settings, referrals, activation_pins).
-- Without EXECUTE permission, authenticated users hit permission errors on
-- every query — breaking all buttons and data loading.
--
-- Fix: Grant EXECUTE back to authenticated ONLY. Keep anon revoked so
-- unauthenticated users can't call it via /rest/v1/rpc/is_current_user_admin.
-- ============================================================

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
