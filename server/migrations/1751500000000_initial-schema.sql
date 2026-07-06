-- Up Migration

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE regions (
  id                   text PRIMARY KEY,
  -- overrides the default XML generator endpoint (was /admin/{region}/recordGeneratorURL)
  record_generator_url text
);

INSERT INTO regions (id) VALUES
  ('pacific'), ('atlantic'), ('stlaurent'), ('amundsen'), ('canwin'), ('test'), ('hakai');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keycloak_sub  text UNIQUE,                -- NULL until first login (pre-provisioned migrated users)
  email         citext UNIQUE NOT NULL,
  display_name  text,
  firebase_uid  text UNIQUE,                -- migration breadcrumb
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

-- which regions a user has signed into (was /{region}/users/{uid}/userinfo)
CREATE TABLE region_users (
  region  text NOT NULL REFERENCES regions(id),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (region, user_id)
);

CREATE TYPE record_status AS ENUM ('draft', 'submitted', 'published');

CREATE TABLE records (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region               text NOT NULL REFERENCES regions(id),
  user_id              uuid NOT NULL REFERENCES users(id),
  status               record_status NOT NULL DEFAULT 'draft',
  title_en             text NOT NULL DEFAULT '',
  title_fr             text NOT NULL DEFAULT '',
  identifier           uuid,                -- uuidv4 dataset identifier from the form
  dataset_identifier   text,                -- DOI string
  filename             text,
  created              timestamptz NOT NULL DEFAULT now(),
  time_first_published timestamptz,
  last_edited_by       jsonb,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  data                 jsonb NOT NULL DEFAULT '{}',
  firebase_key         text                 -- old RTDB push key; referenced by filenames/DOIs
);
CREATE INDEX records_region_user_idx ON records (region, user_id);
CREATE INDEX records_region_status_idx ON records (region, status);
CREATE INDEX records_identifier_idx ON records (identifier);
CREATE UNIQUE INDEX records_firebase_key_idx ON records (region, firebase_key) WHERE firebase_key IS NOT NULL;

CREATE TABLE record_shares (
  record_id  uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (record_id, user_id)
);
CREATE INDEX record_shares_user_idx ON record_shares (user_id);

CREATE TABLE saved_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region       text NOT NULL REFERENCES regions(id),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data         jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  firebase_key text
);
CREATE INDEX saved_contacts_owner_idx ON saved_contacts (region, user_id);

CREATE TABLE saved_platforms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region       text NOT NULL REFERENCES regions(id),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data         jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  firebase_key text
);
CREATE INDEX saved_platforms_owner_idx ON saved_platforms (region, user_id);

CREATE TABLE saved_instruments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region       text NOT NULL REFERENCES regions(id),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data         jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  firebase_key text
);
CREATE INDEX saved_instruments_owner_idx ON saved_instruments (region, user_id);

CREATE TYPE region_role AS ENUM ('admin', 'reviewer');

-- email-keyed on purpose: admins add reviewers who have never logged in
CREATE TABLE region_permissions (
  region text NOT NULL REFERENCES regions(id),
  email  citext NOT NULL,
  role   region_role NOT NULL,
  PRIMARY KEY (region, email, role)
);

CREATE TABLE region_projects (
  region text NOT NULL REFERENCES regions(id),
  name   text NOT NULL,
  PRIMARY KEY (region, name)
);

CREATE TABLE region_credentials (
  region     text NOT NULL REFERENCES regions(id),
  kind       text NOT NULL CHECK (kind IN ('datacite', 'github')),
  config     jsonb NOT NULL DEFAULT '{}',   -- non-secret: prefix/apiDomain or owner/repo/branch
  secret_enc bytea,                          -- AES-256-GCM ciphertext (dataciteHash / github token)
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id),
  PRIMARY KEY (region, kind)
);

-- Down Migration

DROP TABLE region_credentials;
DROP TABLE region_projects;
DROP TABLE region_permissions;
DROP TYPE region_role;
DROP TABLE saved_instruments;
DROP TABLE saved_platforms;
DROP TABLE saved_contacts;
DROP TABLE record_shares;
DROP TABLE records;
DROP TYPE record_status;
DROP TABLE region_users;
DROP TABLE users;
DROP TABLE regions;
