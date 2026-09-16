-- Up Migration

-- Schema-driven form engine: region admins define form types as JSON Schema
-- + UI Schema; members fill and submit them. Deliberately separate from
-- records, which carry the metadata-specific publish/DOI/XML machinery.
CREATE TABLE form_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region      text NOT NULL REFERENCES regions(id),
  slug        text NOT NULL,
  title       jsonb NOT NULL DEFAULT '{"en":"","fr":""}',
  description jsonb NOT NULL DEFAULT '{"en":"","fr":""}',
  json_schema jsonb NOT NULL DEFAULT '{}',
  ui_schema   jsonb NOT NULL DEFAULT '{}',
  -- bumped whenever json_schema changes; submissions snapshot it
  version     integer NOT NULL DEFAULT 1,
  enabled     boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (region, slug)
);

CREATE TYPE form_submission_status AS ENUM ('draft', 'submitted');

CREATE TABLE form_submissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region            text NOT NULL REFERENCES regions(id),
  form_type_id      uuid NOT NULL REFERENCES form_types(id),
  form_type_version integer NOT NULL,
  user_id           uuid NOT NULL REFERENCES users(id),
  status            form_submission_status NOT NULL DEFAULT 'draft',
  data              jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX form_submissions_region_type_idx ON form_submissions (region, form_type_id);
CREATE INDEX form_submissions_owner_idx ON form_submissions (region, user_id);

-- Down Migration

DROP TABLE form_submissions;
DROP TYPE form_submission_status;
DROP TABLE form_types;
