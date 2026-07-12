/*
# CeylonRS Platform Schema

## Overview
Full schema for the CeylonRS crypto reward & mining simulation platform.
Multi-user app with Supabase email/password auth. Every owner-scoped table
defaults `user_id` to `auth.uid()` so inserts that omit it still satisfy RLS.

## Tables
1. `profiles` — extends auth.users: email, referral_code (unique), referred_by,
   is_admin flag, wallet_balance, total_mined, referral_earnings.
2. `packages` — mining packages (free + 5 paid). price_usdt, daily_reward,
   mining_speed (display), duration_days, is_active, is_free, sort_order.
3. `user_packages` — a user's activated package instance. status
   (pending/active/expired), activated_at, expires_at, daily_reward snapshot.
4. `mining_records` — per-day per-package mining accrual. mined/claimed amounts.
5. `claims` — every reward claim event. amount + source (free/paid).
6. `payments` — USDT TRC20 payment requests. tx_hash, screenshot_url, status.
7. `activation_pins` — 8-digit PINs tied to an approved payment. status unused/used.
8. `referrals` — referrer <-> referred link. reward unlocks when referred user
   activates a paid package.
9. `withdrawals` — user withdrawal requests. amount + wallet_address + status.
10. `settings` — singleton row: referral_percentage, free_mining_limit,
    claim_interval_minutes, usdt_trc20_address.

## Security
- RLS enabled on every table.
- Owner-scoped CRUD for users (auth.uid() = user_id).
- Admin override on management tables via EXISTS check on profiles.is_admin.
- Storage bucket `payment-screenshots` for payment screenshot uploads.

## Triggers
- `handle_new_user` — auto-creates a profile row + unique referral code when a
  new auth.users row is inserted (on signup).
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  referral_code text UNIQUE NOT NULL,
  referred_by text,
  is_admin boolean NOT NULL DEFAULT false,
  wallet_balance numeric NOT NULL DEFAULT 0,
  total_mined numeric NOT NULL DEFAULT 0,
  referral_earnings numeric NOT NULL DEFAULT 0,
  last_claim_at timestamptz,
  free_mined_today numeric NOT NULL DEFAULT 0,
  free_mined_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================================
-- PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_usdt numeric NOT NULL DEFAULT 0,
  daily_reward numeric NOT NULL DEFAULT 0,
  mining_speed text NOT NULL DEFAULT '',
  duration_days int NOT NULL DEFAULT 365,
  is_active boolean NOT NULL DEFAULT true,
  is_free boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_packages" ON packages;
CREATE POLICY "select_packages" ON packages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_packages" ON packages;
CREATE POLICY "admin_insert_packages" ON packages FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "admin_update_packages" ON packages;
CREATE POLICY "admin_update_packages" ON packages FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "admin_delete_packages" ON packages;
CREATE POLICY "admin_delete_packages" ON packages FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ============================================================
-- USER PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  activated_at timestamptz,
  expires_at timestamptz,
  daily_reward numeric NOT NULL DEFAULT 0,
  mining_speed text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_packages" ON user_packages;
CREATE POLICY "select_own_user_packages" ON user_packages FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "insert_own_user_packages" ON user_packages;
CREATE POLICY "insert_own_user_packages" ON user_packages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "update_own_user_packages" ON user_packages;
CREATE POLICY "update_own_user_packages" ON user_packages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "delete_own_user_packages" ON user_packages;
CREATE POLICY "delete_own_user_packages" ON user_packages FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ============================================================
-- MINING RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS mining_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  user_package_id uuid REFERENCES user_packages(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  mined_amount numeric NOT NULL DEFAULT 0,
  claimed_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mining_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mining_records" ON mining_records;
CREATE POLICY "select_own_mining_records" ON mining_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "insert_own_mining_records" ON mining_records;
CREATE POLICY "insert_own_mining_records" ON mining_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mining_records" ON mining_records;
CREATE POLICY "update_own_mining_records" ON mining_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CLAIMS
-- ============================================================
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_claims" ON claims;
CREATE POLICY "select_own_claims" ON claims FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "insert_own_claims" ON claims;
CREATE POLICY "insert_own_claims" ON claims FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  email text NOT NULL,
  amount_usdt numeric NOT NULL DEFAULT 0,
  tx_hash text NOT NULL DEFAULT '',
  screenshot_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_payments" ON payments;
CREATE POLICY "admin_update_payments" ON payments FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ============================================================
-- ACTIVATION PINS
-- ============================================================
CREATE TABLE IF NOT EXISTS activation_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE,
  pin text NOT NULL,
  status text NOT NULL DEFAULT 'unused',
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

ALTER TABLE activation_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pins" ON activation_pins;
CREATE POLICY "select_own_pins" ON activation_pins FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "insert_own_pins" ON activation_pins;
CREATE POLICY "insert_own_pins" ON activation_pins FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "update_own_pins" ON activation_pins;
CREATE POLICY "update_own_pins" ON activation_pins FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_referrals" ON referrals;
CREATE POLICY "select_own_referrals" ON referrals FOR SELECT
  TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "insert_own_referrals" ON referrals;
CREATE POLICY "insert_own_referrals" ON referrals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "update_own_referrals" ON referrals;
CREATE POLICY "update_own_referrals" ON referrals FOR UPDATE
  TO authenticated USING (auth.uid() = referrer_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (auth.uid() = referrer_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ============================================================
-- WITHDRAWALS
-- ============================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  wallet_address text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_withdrawals" ON withdrawals;
CREATE POLICY "select_own_withdrawals" ON withdrawals FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "insert_own_withdrawals" ON withdrawals;
CREATE POLICY "insert_own_withdrawals" ON withdrawals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_withdrawals" ON withdrawals;
CREATE POLICY "admin_update_withdrawals" ON withdrawals FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ============================================================
-- SETTINGS (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY DEFAULT 1,
  referral_percentage numeric NOT NULL DEFAULT 10,
  free_mining_limit numeric NOT NULL DEFAULT 1000,
  claim_interval_minutes int NOT NULL DEFAULT 5,
  usdt_trc20_address text NOT NULL DEFAULT 'TQn9Y2khEsLJW1ChVWFkMeHGH2trL6LnCR',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_settings" ON settings;
CREATE POLICY "select_settings" ON settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ============================================================
-- STORAGE BUCKET for payment screenshots
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "screenshot_upload" ON storage.objects;
CREATE POLICY "screenshot_upload" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'payment-screenshots');

DROP POLICY IF EXISTS "screenshot_read" ON storage.objects;
CREATE POLICY "screenshot_read" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'payment-screenshots');

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  ref_code text;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text || NEW.id::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code);
  END LOOP;

  ref_code := NEW.raw_user_meta_data->>'referral_code';

  INSERT INTO public.profiles (id, email, referral_code, referred_by)
  VALUES (NEW.id, NEW.email, new_code, ref_code);

  IF ref_code IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, status)
    SELECT p.id, NEW.id, 'pending'
    FROM public.profiles p
    WHERE p.referral_code = ref_code
      AND p.id <> NEW.id
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED: settings singleton
-- ============================================================
INSERT INTO settings (id, referral_percentage, free_mining_limit, claim_interval_minutes, usdt_trc20_address)
VALUES (1, 10, 1000, 5, 'TQn9Y2khEsLJW1ChVWFkMeHGH2trL6LnCR')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: packages (free + 5 paid, proportional daily rewards)
-- Rate derived from Package 1: 217600 / 23 USDT = 9460.869565 per USDT
-- ============================================================
INSERT INTO packages (name, price_usdt, daily_reward, mining_speed, duration_days, is_active, is_free, sort_order) VALUES
  ('Free Mining',      0,    1000,     '0.69/min',    0,     true, true,  0),
  ('CeylonRS Starter', 23,   217600,   '9,066/hr',    365,   true, false, 1),
  ('CeylonRS Bronze',  55,   520348,   '21,681/hr',   365,   true, false, 2),
  ('CeylonRS Silver',  115,  1088000,  '45,333/hr',   365,   true, false, 3),
  ('CeylonRS Gold',    550,  5203478,  '216,811/hr',  365,   true, false, 4),
  ('CeylonRS Diamond', 1150, 10880000, '453,333/hr',  365,   true, false, 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_activation_pins_user ON activation_pins(user_id);
