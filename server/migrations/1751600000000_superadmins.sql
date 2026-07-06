-- Up Migration

-- email-keyed like region_permissions: grants can precede first login.
-- Emails in the SUPERADMIN_EMAILS env var are superadmins in addition to
-- these rows (bootstrap path, not revocable via the API).
CREATE TABLE superadmins (
  email      citext PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Down Migration

DROP TABLE superadmins;
