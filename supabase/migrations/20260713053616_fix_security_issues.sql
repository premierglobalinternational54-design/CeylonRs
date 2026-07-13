-- ============================================================
-- Fix security issues flagged by Supabase security advisor
-- ============================================================

-- 1. Drop broad SELECT policy on storage.objects for payment-screenshots bucket.
--    The bucket is public, so files are accessible via public URL without this policy.
--    Removing it prevents authenticated users from listing all uploaded screenshots.
DROP POLICY IF EXISTS "screenshot_read" ON storage.objects;

-- 2. Revoke EXECUTE on handle_new_user from anon and authenticated.
--    This is a trigger function (runs on auth.users INSERT) and should never be
--    called directly via RPC. Triggers run with the function's definer context,
--    so revoking EXECUTE does not affect trigger behavior.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- 3. Revoke EXECUTE on is_current_user_admin from anon and authenticated.
--    This function is used inside RLS policy expressions. RLS policies are
--    evaluated by the table owner, so the function remains callable from
--    policies even without direct EXECUTE grants to anon/authenticated.
--    Revoking prevents users from calling it via /rest/v1/rpc/is_current_user_admin.
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon, authenticated;
