-- Add mining tracking fields to user_packages for paid package mining
ALTER TABLE user_packages
  ADD COLUMN IF NOT EXISTS mining_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mining_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS mining_accumulated numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_claim_at timestamptz;
