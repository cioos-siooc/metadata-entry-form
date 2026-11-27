-- Up Migration

-- Short-lived server-side state for an in-progress OAuth authorization-code
-- flow. The browser holds only the opaque `state`; the PKCE verifier and nonce
-- never leave the server. Swept by expires_at.
CREATE TABLE oauth_flows (
  state         text PRIMARY KEY,
  provider      text NOT NULL,
  code_verifier text NOT NULL,
  nonce         text NOT NULL,
  return_to     text,
  link_user_id  uuid REFERENCES users(id) ON DELETE CASCADE,  -- set when linking to a logged-in user
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX oauth_flows_expires_idx ON oauth_flows (expires_at);

-- Down Migration

DROP TABLE oauth_flows;
