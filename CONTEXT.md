# CONTEXT

This file is the canonical glossary for the Isomer Next codebase. It is **policy-free** — it defines what concepts *are*, not how they are configured. Specific numbers, thresholds, and policies live in `docs/adr/` instead.

When you encounter a term in conversation or code that disagrees with this glossary, treat the glossary as the source of truth and either correct the term or update this file.

## Terms

### Preview link

A revocable, **short-lived** URL (hours to days, never weeks or longer) minted by an editor that grants a non-logged-in person read-only access to the live current draft of a single page.

The short lifetime is part of the definition, not a config knob: a long-lived equivalent would be a different concept (an account, an API key) — not a preview link. Concrete lifetime bounds are a policy decision recorded separately in an ADR; this term only commits to "short" at the order of magnitude of days.

A preview link is the *access grant*. The rendered page itself is the *preview*. The URL is the *token-bearing form* of the grant.

### Preview

The rendered draft of a page as seen by a non-editor (typically via a preview link). Always reflects the latest saved draft at view time — no separate stored representation, no snapshot. Visually identical to the public-site render of the page, wrapped in a thin Studio chrome that identifies it as a preview.

### Sharer

The Studio user (editor or admin) who minted a preview link. The link is attributed to them in audit logs and shown in their personal "Manage preview links" list. A sharer can revoke their own links; a Site Admin can revoke any link on their site.

### Recipient

Any person who opens a preview link. Has no Studio identity — preview links intentionally do not require account creation or login. Recorded only as `(IP, user-agent, country)` in audit-log view rows, never as a named user.

### Mint (verb)

The act of creating a new preview link. "Minting" is preferred over "creating" or "generating" because each link is a single-use token grant attributable to a specific sharer at a specific time — minting carries the connotation of issuing a credential, which is what's happening. Used consistently in code (`mintPreviewLink`), event names (`PreviewLinkMint`), and UI copy where the action verb appears.
