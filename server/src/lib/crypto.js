const crypto = require("crypto");
const config = require("../config");

// AES-256-GCM for per-region credentials (DataCite hash, GitHub token).
// Layout: 12-byte IV | 16-byte auth tag | ciphertext.
// Key lives only in the API process (CREDENTIALS_ENC_KEY env), never in
// Postgres — a DB dump alone cannot reveal the secrets.

function getKey() {
  if (!config.credentialsEncKey) {
    throw new Error("CREDENTIALS_ENC_KEY is not set; cannot handle region credentials");
  }
  const key = Buffer.from(config.credentialsEncKey, "hex");
  if (key.length !== 32) {
    throw new Error("CREDENTIALS_ENC_KEY must be 64 hex characters (32 bytes)");
  }
  return key;
}

function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

function decryptSecret(buffer) {
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const ciphertext = buffer.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

module.exports = { encryptSecret, decryptSecret };
