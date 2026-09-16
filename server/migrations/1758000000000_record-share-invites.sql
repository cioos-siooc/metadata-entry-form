-- Up Migration

-- Pending shares: a record shared with an email address that has no account
-- yet. Claimed into record_shares once that address signs up with a verified
-- email (lib/shareInvites.js). Server-only; never exposed beyond the record's
-- pendingShares list.
CREATE TABLE record_share_invites (
  record_id  uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  email      text NOT NULL,
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (record_id, email)
);
CREATE INDEX record_share_invites_email_idx ON record_share_invites (email);

-- Down Migration

DROP TABLE record_share_invites;
