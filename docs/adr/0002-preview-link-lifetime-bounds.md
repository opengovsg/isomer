# Preview link lifetime is capped at 7 days

Preview links expire after a sharer-chosen duration of `24h`, `3d`, or `7d` (default `3d`). The cap is 7 days, not 30 or longer. Anyone asking for a longer-lived preview link is asking for a different feature (an account, an API key) — not a longer preview link.

## Why these numbers

- **24h** covers same-day sign-off.
- **3d** covers a normal review cycle (share Friday, reviewed by Monday).
- **7d** covers "review while I'm overseas" extended cases.
- Anything beyond a week stops being a "preview" and starts being persistent unauthenticated access to gov draft content — which has a different threat model and should be a separate feature with a different name and design.

## Consequences

Editors who need to keep a page reviewable for longer than 7 days must re-mint a link. This is intentional friction — it forces a fresh access decision rather than letting a one-time grant drift into a long-term credential. If a sharer asks "why can't I just make it 30 days?" the answer is to revisit this ADR, not to bump the cap.
