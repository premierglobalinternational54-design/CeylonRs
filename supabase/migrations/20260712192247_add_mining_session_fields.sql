/*
# Add mining session fields to profiles

## Changes
- Add `mining_active` (boolean, default false) — whether free mining is currently running
- Add `mining_started_at` (timestamptz, nullable) — when the current mining session started
- Add `mining_accumulated` (numeric, default 0) — tokens accumulated since last claim in current session

## Notes
- These fields let the UI show a live "mining in progress" animation with a progress bar
  that fills toward the daily 1000 CRS limit over 24 hours.
- `free_mined_today` and `free_mined_date` already exist for daily limit tracking.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mining_active boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mining_started_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mining_accumulated numeric NOT NULL DEFAULT 0;
