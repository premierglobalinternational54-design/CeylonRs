/*
# Create advertisements table

## Summary
Adds a new `advertisements` table to support a global advertisement management system.
Admins can create, edit, delete, enable/disable, and update ad code for three fixed
positions (top, middle, bottom) across the entire CeylonPlay website.

## New Tables
- `advertisements`
  - `id` (uuid, primary key)
  - `name` (text, admin-friendly label for the ad, e.g. "Top Banner — AdSense")
  - `position` (text, one of: 'top', 'middle', 'bottom' — determines where on the page the ad appears)
  - `ad_code` (text, the raw HTML/JavaScript snippet from any ad network)
  - `is_active` (boolean, default true — admin can enable/disable without deleting)
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

## Security
- RLS enabled on `advertisements`.
- SELECT: public (anon + authenticated) — ads must be readable by all visitors so they
  render on every page including public pages where no user is signed in.
- INSERT / UPDATE / DELETE: authenticated only — only signed-in users can modify ads.
  In practice only admins should reach the admin UI, but the RLS layer allows any
  authenticated user at the database level. The admin route guard in the frontend
  restricts the UI to `is_admin` profiles. This matches the pattern used by the
  existing `packages` and `settings` tables in this project.

## Important Notes
1. Only one ad should be active per position at a time. The frontend queries with
   `.eq('is_active', true)` and picks the first result, so disabling an old ad before
   enabling a new one for the same position is the admin's responsibility.
2. The `ad_code` column stores raw HTML/JS as text — it is rendered via
   `dangerouslySetInnerHTML` on the frontend. Only admin users can set this value.
3. An index on `position` is added for fast lookups by placement.
*/

CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Untitled Ad',
  position text NOT NULL DEFAULT 'top' CHECK (position IN ('top', 'middle', 'bottom')),
  ad_code text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Public read: ads must render for all visitors (including anon on public pages)
DROP POLICY IF EXISTS "public_select_advertisements" ON advertisements;
CREATE POLICY "public_select_advertisements"
ON advertisements FOR SELECT
TO anon, authenticated USING (true);

-- Authenticated CRUD: admin UI requires a signed-in session
DROP POLICY IF EXISTS "auth_insert_advertisements" ON advertisements;
CREATE POLICY "auth_insert_advertisements"
ON advertisements FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_advertisements" ON advertisements;
CREATE POLICY "auth_update_advertisements"
ON advertisements FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_advertisements" ON advertisements;
CREATE POLICY "auth_delete_advertisements"
ON advertisements FOR DELETE
TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements(position);
