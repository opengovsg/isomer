# Bug automation allow-list

This doc enumerates the categories of bugs that the `triage` + `bugfix` skills are allowed to ship a PR for **without a human in the loop on plan selection**. Everything else: the agent can triage and post findings, but a human picks the approach.

The allow-list expands over time. New categories are added only after the team has reviewed a sample of agent-shipped PRs in that category and agrees the fix pattern is reliable.

## Currently allow-listed

A bug is allow-listed only when *every* line below is true.

1. **The fix is local.** Changes touch at most one module under `apps/studio/src/server/modules/` *or* one feature under `apps/studio/src/features/` *or* one component under `apps/studio/src/components/` or `packages/components/src/templates/next/components/`.
2. **The bug has a deterministic repro.** The triage skill produced a failing test that reliably reproduces the bug without flakes.
3. **The category is one of the following.**

### Allowed categories

| Category                      | What it looks like                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Null/undefined guard**      | A crash on a missing optional field. Fix: add the guard, return early or fall back to a documented default. |
| **Off-by-one**                | Pagination, slicing, index arithmetic that's one step wrong. Fix: adjust the constant + add the boundary test. |
| **UI regression**             | Visual or behavioural drift in a single component caused by a recent change. Fix: revert the drift in that component. |
| **Date/time formatting**      | Wrong format token, wrong timezone for display-only code (not storage). Fix: adjust the format string + test. |
| **Copy / string fix**         | Wrong wording, typo, missing translation. Fix: edit the string in `~/constants/` or i18n file.              |
| **Validation message**        | A Zod schema rejects valid input or accepts invalid input with a documented intended boundary. Fix: tighten the constraint + add a schema test. |
| **Dead import / unused code** | A linter-flagged dead path. Fix: remove + verify nothing else depends.                                       |
| **Type narrowing fix**        | A TS error caused by missing narrowing, where the runtime is already correct. Fix: add the narrowing + cast assertion test. |

## Not allow-listed (agent triages only)

These categories produce a Linear comment + a failing test in a draft PR — but the agent stops and waits for a human to pick the approach:

- Authentication and session lifecycle (`server/modules/auth/**`)
- Permission and authorization (`server/modules/permissions/**`)
- Audit logging changes
- Rate limiting changes
- Anything that requires a database migration
- Anything in `server/trpc.ts`, `server/context.ts`, `server/webhooks.ts`
- Race conditions and concurrency
- Memory leaks
- Performance regressions where the fix changes algorithmic complexity
- Anything that touches `apps/studio/src/env.mjs` or feature flags
- Cross-module fixes (more than one module's service involved)
- Anything labelled `risk:high` per `docs/risk-taxonomy.md`

## Hard limits regardless of category

The agent must refuse to ship even an allow-listed fix when:

- The minimal fix would exceed **100 LOC of source-code change** (tests don't count).
- The fix requires deleting or replacing more than 20 LOC of existing logic (replace > delete heuristic — large rewrites are not bug fixes).
- The diff touches a file under `risk:high` globs.
- The originating Linear ticket lacks the canonical fields per `docs/ai-workflow.md`.
- The failing test cannot be written before the fix (no test-first → no automation).

When refused, post the diagnosis as a Linear comment and stop.

## Evolution

To propose a new category for the allow-list:

1. Collect ≥5 examples of recent merged PRs in the proposed category.
2. Verify each PR fits the allow-list rules above (local, deterministic, bounded LOC).
3. Open a PR adding the category to this file with the examples linked in the PR body.
4. The PR needs sign-off from two engineers active on Isomer.

Removing a category needs only one engineer's call — if the agent ships a regression, narrow the allow-list immediately.
