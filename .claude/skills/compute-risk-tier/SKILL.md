---
name: compute-risk-tier
description: Compute the risk tier for a pull request using the project taxonomy (including reversibility modifiers), apply the correct risk:low/medium/high label, and write the result to /tmp/risk-result.json. Safe to call locally or from CI.
---

# Instructions

Compute the risk tier for a pull request and apply the correct GitHub label.

## Inputs

- `docs/risk-taxonomy.md` — file-glob rules, reversibility modifiers, and auto-approve caveats. **Read at run time — do not use cached assumptions.**
- The PR diff — fetched via `gh pr diff`.
- Optional argument: a PR number. If provided, use it directly. Otherwise detect via `gh pr view --json number -q .number`.

## Procedure

1. **Resolve the PR number.** If an argument was passed (e.g. `/compute-risk-tier 123`), use it. Otherwise run:
   ```
   gh pr view --json number -q .number
   ```
   If both fail, abort with an error message.

2. **Read the taxonomy.** Read `docs/risk-taxonomy.md` in full. Extract:
   - The file-glob → tier table (high / medium / low sections)
   - The reversibility modifiers
   - The feature-flag gating note

3. **Get the diff** (file names are derivable from `diff --git` headers in the output).
   ```
   gh pr diff <number>
   ```

5. **Determine the tier.**
   a. Apply file-glob matching top-down — highest tier across all changed files wins.
   b. Apply reversibility modifiers — bump one level if the diff:
      - Sends external side-effects (email, Slack notification, outbound webhook call)
      - Mutates existing rows outside of a database migration (backfill script, ad-hoc update)
      - Changes a pgboss job handler function signature or job payload type
   c. Note (but do not change the tier) if all new behaviour is gated behind a GrowthBook feature flag — record this in the reason.

6. **Post a comment** on the PR explaining the decision:
   ```
   gh pr comment <number> --body "<comment>"
   ```
   Format:
   ```markdown
   ## 🏷️ Risk tier: `risk:<tier>`

   <reason>
   ```
   If a reversibility modifier was applied, call it out explicitly. If behaviour is feature-flag gated, note it.

7. **Write the result** to `/tmp/risk-result.json`:
   ```json
   {"tier": "<low|medium|high>", "reason": "<one sentence explaining the key signal>"}
   ```

8. **Print a summary** to stdout:
   ```
   Risk tier: <tier>
   Reason: <reason>
   ```

## Hard rules

- **Read the taxonomy at run time.** Never rely on remembered glob patterns — the team updates the file frequently.
- **Never downgrade a tier because the diff looks small.** Tier is determined by what is touched, not by how much is changed.
- **Reversibility modifiers can only raise the tier, never lower it.** The feature-flag note is informational only.
- **If `docs/risk-taxonomy.md` is missing**, abort and print an error — do not guess.

## Failure modes

- PR number cannot be resolved → abort with a clear error.
- `docs/risk-taxonomy.md` missing → abort with a clear error.
- `gh pr diff` fails (e.g. PR not found) → abort.
- Comment posting fails → print the error but still write `/tmp/risk-result.json` so CI can continue.
