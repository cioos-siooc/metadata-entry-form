-- Up Migration

-- Local email+password support. password_hash is NULL for social-only users.
-- email_verified was carried on Keycloak tokens but never persisted; local
-- auth needs it to gate login until the address is confirmed.
ALTER TABLE users ADD COLUMN password_hash  text;
ALTER TABLE users ADD COLUMN email_verified  boolean NOT NULL DEFAULT false;

-- Rows migrated from Keycloak/Firebase already had a verified email upstream;
-- trust that so existing users aren't locked out at cutover.
UPDATE users SET email_verified = true WHERE keycloak_sub IS NOT NULL OR firebase_uid IS NOT NULL;

-- Down Migration

ALTER TABLE users DROP COLUMN email_verified;
ALTER TABLE users DROP COLUMN password_hash;
