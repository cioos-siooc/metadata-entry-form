// Shared nodemailer transport. Gmail credentials come from deploy-time params,
// with process.env taking precedence for local/emulator runs.
const { defineString } = require("firebase-functions/params");
const nodemailer = require("nodemailer");

const gmailUser = defineString("GMAIL_USER");
const gmailPass = defineString("GMAIL_PASS");

module.exports = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || gmailUser.value(),
    pass: process.env.GMAIL_PASS || gmailPass.value(),
  },
});
