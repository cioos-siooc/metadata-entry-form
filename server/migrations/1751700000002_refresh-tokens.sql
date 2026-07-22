-- Up Migration

-- Rotating refresh tokens. Only the SHA-256 hash of the token is stored.
-- session_id groups a rotation family (issued at login, rotated on refresh);
-- replaced_by points at the token that superseded this one so that presenting
-- an already-rotated token (reuse) can revoke the whole family.
CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  uuid NOT NULL,
  token_hash  text NOT NULL UNIQUE,
  replaced_by uuid REFERENCES refresh_tokens(id),
  revoked_at  timestamptz,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_session_idx ON refresh_tokens (session_id);
CREATE INDEX refresh_tokens_expires_idx ON refresh_tokens (expires_at);

-- Down Migration

DROP TABLE refresh_tokens;
