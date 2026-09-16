-- Up Migration

-- One row per external identity (provider account or local password login)
-- linked to a user. Replaces the single users.keycloak_sub column: a user can
-- now link google + microsoft + orcid + a local password simultaneously.
-- provider: 'local' | 'google' | 'microsoft' | 'orcid'
-- provider_subject: the provider's stable subject (`sub`); for 'local' it is
-- the users.id (a user has exactly one local identity).
CREATE TABLE user_identities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         text NOT NULL,
  provider_subject text NOT NULL,
  email            citext,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_login_at    timestamptz,
  UNIQUE (provider, provider_subject)
);
CREATE INDEX user_identities_user_idx ON user_identities (user_id);

-- Down Migration

DROP TABLE user_identities;
