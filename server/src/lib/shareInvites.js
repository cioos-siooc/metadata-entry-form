// Grants a newly verified user every record that was shared with their email
// address before they had an account. Only call once the email is verified —
// otherwise registering someone else's address would claim their invites.
async function claimInvites(q, userId, email) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized) return;
  await q(
    `WITH claimed AS (
       DELETE FROM record_share_invites i
       USING records r
       WHERE i.email = $2 AND r.id = i.record_id
       RETURNING i.record_id, r.user_id AS owner_id
     )
     INSERT INTO record_shares (record_id, user_id)
     SELECT record_id, $1 FROM claimed WHERE owner_id <> $1
     ON CONFLICT DO NOTHING`,
    [userId, normalized],
  );
}

module.exports = { claimInvites };
