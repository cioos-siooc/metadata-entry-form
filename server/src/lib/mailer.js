const nodemailer = require("nodemailer");
const config = require("../config");

// Single shared nodemailer transporter (was private to services/notify.js).
let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

// Verification / password-reset emails for local accounts. Link points at the
// SPA, which POSTs the token back to the API.
async function sendVerifyEmail(to, token) {
  const link = `${config.spaBaseUrl}/#/auth/verify-email?token=${encodeURIComponent(token)}`;
  await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject: "Verify your CIOOS metadata account",
    text: `Welcome! Confirm your email address to finish setting up your account:\n\n${link}\n\nThis link expires in ${config.auth.emailTokenTtlHours} hours. If you did not create an account, you can ignore this message.`,
  });
}

// `isFirstPassword` is true for an account created through Google, Microsoft
// or ORCID, which has no password yet. "Reset your password" would be
// confusing for someone who has never had one, so the copy differs.
async function sendPasswordResetEmail(to, token, { isFirstPassword = false } = {}) {
  // Same SPA route either way — the token and the screen are identical, and
  // adding a route would mean touching the web app. Only the copy differs.
  const link = `${config.spaBaseUrl}/#/auth/reset-password?token=${encodeURIComponent(token)}`;
  const expiry = `This link expires in ${config.auth.emailTokenTtlHours} hours. If you did not request this, you can ignore this message.`;

  await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject: isFirstPassword
      ? "Set a password for your CIOOS metadata account"
      : "Reset your CIOOS metadata password",
    text: isFirstPassword
      ? `Your account currently signs in with Google, Microsoft or ORCID. You can add a password so you can also sign in directly — useful on the mobile app:\n\n${link}\n\n${expiry}`
      : `A password reset was requested for your account. Set a new password:\n\n${link}\n\n${expiry}`,
  });
}

module.exports = { getTransporter, sendVerifyEmail, sendPasswordResetEmail };
