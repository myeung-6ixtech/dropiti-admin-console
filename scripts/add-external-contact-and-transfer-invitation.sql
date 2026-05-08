-- Migration: add external_contact column and property_transfer_invitation table
-- Run once against the Nhost / Postgres database.

-- 1. Add external_contact to property_listing (admin-only write, excluded from public select)
ALTER TABLE real_estate.property_listing
  ADD COLUMN IF NOT EXISTS external_contact text;

COMMENT ON COLUMN real_estate.property_listing.external_contact
  IS 'Admin-only. E.164 phone number of the external owner / agent used for WhatsApp ownership-invitation outreach.';

-- 2. Create the transfer-invitation table (tracks one invitation token per property)
CREATE TABLE IF NOT EXISTS real_estate.property_transfer_invitation (
  id            bigserial PRIMARY KEY,
  token_uuid    uuid        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  property_uuid uuid        NOT NULL REFERENCES real_estate.property_listing(property_uuid) ON DELETE CASCADE,
  invited_by    text        NOT NULL,        -- admin user id who sent the invite
  external_contact text     NOT NULL,        -- phone number the invite was sent to
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_transfer_invitation_property_uuid
  ON real_estate.property_transfer_invitation(property_uuid);
CREATE INDEX IF NOT EXISTS idx_property_transfer_invitation_token_uuid
  ON real_estate.property_transfer_invitation(token_uuid);
CREATE INDEX IF NOT EXISTS idx_property_transfer_invitation_status
  ON real_estate.property_transfer_invitation(status);

COMMENT ON TABLE real_estate.property_transfer_invitation
  IS 'One row per ownership-transfer invitation. Admin creates these; the recipient claims via /transfer-ownership/[token].';

-- (Optional) Hasura scheduled event to sweep expired tokens — run separately or via Hasura console:
-- UPDATE real_estate.property_transfer_invitation
--   SET status = 'expired'
--   WHERE status = 'pending' AND expires_at < NOW();
