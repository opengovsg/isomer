# Preview links are URL-only, no per-recipient gate

Preview links grant read-only access to a draft page via a long random token in the URL alone — no OTP, no email-binding, no password. We picked this over an OTP-style gate (the obvious "gov-safe" choice) because the feature exists to reduce friction for non-Studio reviewers (a director signing off on a draft), and any auth step undermines that goal; the threat model is casual forwarding rather than determined attackers, and is mitigated by short lifetimes, revocation, audit logging, and a 256-bit token.

## Considered Options

- **URL-only (chosen).** One click for the recipient. Bounded risk from forwarding via short lifetime + audit.
- **URL + email OTP.** Higher security; binds access to a named recipient. Rejected because OTP UX (check email, copy code, paste) is exactly the friction the feature exists to remove, and gov inbox delivery is often slow or quarantined.
- **URL + shared password.** Sharer mints link + passphrase, shares via separate channels. Rejected as v1 — extra coordination burden on the sharer for a threat we don't have.

## Consequences

If a soft-gate is ever added (sharer-provided password or matching recipient email, checked at view time without OTP infra), it ships as an additive migration adding nullable columns to `PreviewLink` at that time — the v1 schema does **not** reserve placeholder columns upfront. Switching the *default* posture from URL-only to gated would be a one-way break for already-minted tokens, so any future change should be an additive per-link opt-in, not a global flip.
