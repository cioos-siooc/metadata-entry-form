-- Up Migration

-- Native clients get their own session metadata. `client_type` is what gates
-- every behavioural difference (longer TTL, reuse grace window, body-transport
-- refresh) so web semantics stay byte-for-byte unchanged.
ALTER TABLE refresh_tokens ADD COLUMN client_type text NOT NULL DEFAULT 'web'
  CHECK (client_type IN ('web', 'native'));
ALTER TABLE refresh_tokens ADD COLUMN device_id    text;
ALTER TABLE refresh_tokens ADD COLUMN device_name  text;
ALTER TABLE refresh_tokens ADD COLUMN last_used_at timestamptz;

-- Supports "sign out my lost phone" without scanning the table.
CREATE INDEX refresh_tokens_device_idx ON refresh_tokens (user_id, device_id);

ALTER TABLE oauth_flows ADD COLUMN client_type text NOT NULL DEFAULT 'web'
  CHECK (client_type IN ('web', 'native'));
-- NOTE: oauth_flows.code_verifier is OUR PKCE verifier toward the IdP. This is
-- the APP's challenge toward US — a different leg of a different exchange, so
-- deliberately a different column rather than reusing that one.
ALTER TABLE oauth_flows ADD COLUMN app_code_challenge text;
ALTER TABLE oauth_flows ADD COLUMN device_id   text;
ALTER TABLE oauth_flows ADD COLUMN device_name text;

-- Short-lived single-use code handed to a native app after OAuth. The app
-- exchanges it for tokens over a normal POST, so the refresh token never
-- travels in a custom-scheme redirect URL — those land in OS logs and any app
-- can register the same scheme.
CREATE TABLE native_auth_codes (
  code_hash             text PRIMARY KEY,
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_code_challenge    text NOT NULL,
  code_challenge_method text NOT NULL DEFAULT 'S256',
  device_id             text,
  device_name           text,
  expires_at            timestamptz NOT NULL,
  used_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX native_auth_codes_expires_idx ON native_auth_codes (expires_at);

-- Down Migration

DROP TABLE native_auth_codes;
ALTER TABLE oauth_flows DROP COLUMN device_name;
ALTER TABLE oauth_flows DROP COLUMN device_id;
ALTER TABLE oauth_flows DROP COLUMN app_code_challenge;
ALTER TABLE oauth_flows DROP COLUMN client_type;
DROP INDEX refresh_tokens_device_idx;
ALTER TABLE refresh_tokens DROP COLUMN last_used_at;
ALTER TABLE refresh_tokens DROP COLUMN device_name;
ALTER TABLE refresh_tokens DROP COLUMN device_id;
ALTER TABLE refresh_tokens DROP COLUMN client_type;
