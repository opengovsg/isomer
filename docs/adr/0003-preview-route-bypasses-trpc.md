# Preview route bypasses tRPC — token validation via `getServerSideProps`

The `/preview/<token>` route validates its token and fetches page data inside Next.js `getServerSideProps`, calling service functions in `server/modules/*` directly rather than going through a tRPC procedure. This is a deliberate deviation from the codebase's default pattern (every other client-facing endpoint goes through tRPC).

## Why

A tRPC procedure for the preview route would need to be a `publicProcedure` (anonymous caller) that takes the token as its only auth input. That works, but it splits the trust boundary across two layers: the page route renders something, and the tRPC call validates the token. Token validation, audit-row write, rate-limit check, and the decision to render-vs-show-revoked-page all need to happen *together* and *exactly once per page load*. Putting them in `getServerSideProps` makes that atomicity obvious and lets the route own the entire flow.

## Considered Options

- **New `publicProcedure` endpoints (rejected).** Reuses the tRPC pipeline. Rejected because preview is the only surface in Studio with anonymous read access; introducing a `publicProcedure` family for one feature creates an auth-shape that future engineers may accidentally reach for in contexts where it doesn't belong.
- **`getServerSideProps` + direct service calls (chosen).** Token check and audit write co-located with the route that depends on them. The "preview is different" boundary is enforced at one file.

## Consequences

A future engineer reading the codebase will see "every endpoint goes through tRPC except `/preview/<token>`" and may want to "fix" it for consistency. This ADR exists to stop that — the divergence is intentional. If a second anonymous-access feature appears later, revisit this decision rather than copy the pattern blindly.
