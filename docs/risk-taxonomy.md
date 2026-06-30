# PR risk taxonomy

This doc maps file-glob heuristics and content signals → risk tier. It is the source of truth for the `/compute-risk-tier`, `/pr-review`, and `/security-review` skills, the auto-approve gate, and any future code-review automation.

Tiers reflect actual reversibility and blast radius: if multiple globs match a single PR, the **highest** tier wins, but content-based signals (additive-only, feature-flag gating) can lower MEDIUM → LOW.

## Tiers

| Tier         | Meaning                                                                                       | Auto-approve? |
| ------------ | --------------------------------------------------------------------------------------------- | ------------- |
| `risk:low`   | Cosmetic, docs, deps, copy, pure UI, utilities. Cannot break runtime behaviour or change data. | Yes, with caveats below. |
| `risk:medium`| Changes server-side behaviour, data contracts, or shared library code. Requires human approve. | No.           |
| `risk:high`  | Touches security, auth, migrations, infra, or cross-cutting code. Requires human approve + a tagged reviewer. | No.           |

## File-glob → tier

Match top-down — the first matching glob wins for that file. The PR's tier is the max across its files, then content signals are applied.

### `risk:high`

- `apps/studio/prisma/migrations/**`
- `apps/studio/prisma/schema.prisma`
- `apps/studio/src/server/modules/auth/**`
- `apps/studio/src/server/modules/permissions/**`
- `apps/studio/src/server/modules/audit/**`
- `apps/studio/src/server/modules/rate-limit/**`
- `apps/studio/src/server/trpc.ts`
- `apps/studio/src/server/context.ts`
- `apps/studio/src/server/webhooks.ts`
- `apps/studio/src/lib/growthbook*` — exception: PRs that only _add_ new flag key constants (no modification of existing keys, fallback values, or evaluation helpers) are risk:medium
- `apps/studio/src/env.mjs`
- `.github/workflows/**`
- `tooling/**` (shared configs)
- `**/seed.ts`
- `infrastructure/**` (if/when added)

**Reversibility modifiers — any file, any tier:**

These signals bump a PR's tier by one level. The test: *can a user's data be lost or corrupted in a way that survives rolling back the PR?*

| Signal | Why |
| ------ | ---- |
| Sends external side-effects (email, Slack notification, outbound webhook) | Cannot be unsent after deploy |
| Mutates existing rows outside of a migration (backfill script, ad-hoc update) | Cannot be un-mutated without another migration |
| Removes or renames a pgboss job handler, or changes its payload type | Jobs already in the queue are processed by the new handler or fail silently — no code rollback can fix in-flight jobs |
| Deletes objects from S3 or CDN storage (look for `deleteObject`, `s3.delete`, CDN purge calls) | Deleted objects do not come back on code rollback; published pages referencing them stay broken until manually re-published |

**What is NOT a reversibility risk:**

Any change that leaves no externally-persisted state after a rollback. Rolling back a PR reverts all code atomically — so schema changes (Zod/Prisma), tRPC procedure changes, and Redis/cache structure changes are all safe when every caller is updated in the same PR. TypeScript catches mismatches at compile time; CI validates the rest.

**Content signals — lower MEDIUM → LOW (never lower HIGH):**

| Signal | Why |
| ------ | ---- |
| All changed behaviour is gated behind a GrowthBook feature flag | Can be disabled without a redeploy; safe to treat as low blast radius |
| PR is purely additive in MEDIUM-path files — no `-` hunks (excluding `---` diff metadata) | No existing behaviour changed; full rollback with no data consequences |

If either applies to a MEDIUM PR, output `risk:low` and state which signal triggered it.

### `risk:medium`

Server-side logic, data contracts, and shared libraries — things where a bug can corrupt data or break published sites.

- `apps/studio/src/server/modules/**` (all modules except auth/permissions/audit/rate-limit which are high)
- `apps/studio/src/pages/api/**`
- `apps/studio/src/features/**`
- `apps/studio/src/schemas/**`
- `apps/studio/src/lib/**`
- `packages/components/src/templates/**`
- `packages/components/src/schemas/**`
- `packages/components/src/engine/**`
- `packages/pgboss/**`, `packages/redis/**`, `packages/logging/**`, `packages/validators/**` — exception: removing/renaming a pgboss job handler or changing its payload type triggers the reversibility modifier and bumps to risk:high

### `risk:low`

Client-side UI code, utilities, docs, and tests — reversible, contained blast radius, no direct data integrity implications.

- `**/*.md`, `**/*.mdx`
- `docs/**`
- `**/CLAUDE.md`
- `**/*.stories.tsx`, `**/stories/**`
- `**/__tests__/**`, `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`
- `package.json` for dependency-only diffs from Dependabot or Renovate (no script changes)
- `pnpm-lock.yaml` paired with a dep-only `package.json` change
- `apps/studio/src/constants/**` for copy / strings only (no logic)
- `**/i18n/**`, `**/locales/**`
- `apps/studio/src/components/**`
- `apps/studio/src/hooks/**`
- `apps/studio/src/utils/**`

## Auto-approve caveats

`risk:low` is *eligible* for AI approval (a formal GitHub APPROVE review submitted by the bot, counting toward required approvals). It is auto-approved only when **all** of the following hold:

1. The PR touches no file outside the `risk:low` globs.
2. CI is green (lint, typecheck, build, tests).
3. The code review agent finds no Must Fix or Should Fix findings (after any dismissals).
4. The security review agent finds no blocking findings.
5. The PR does not change `package.json` scripts, `engines`, `pnpm.overrides`, or workspace dependencies.
6. No reversibility modifier applies (external side-effects, row mutations, pgboss handler removal/rename/payload change, S3 object deletions).

If any condition fails, the PR is downgraded to "human review required" and the agent leaves an annotation explaining why. A human still clicks merge — the bot approval satisfies the required-approvals gate but does not auto-merge.

## Hot paths to flag (any tier)

Even within `risk:medium`, the following sub-paths are "hot" and should be called out by the `pr-review` skill with a banner. Code review agent findings in hot-path files are escalated by one severity level (Consider → Should Fix, Should Fix → Must Fix):

- `apps/studio/src/server/modules/page/page.service.ts` — publish + scheduled publish flow
- `apps/studio/src/server/modules/resource/**` — resource graph mutations
- `apps/studio/src/features/editing-experience/**` — the editor core; any change risks publisher data loss
- `packages/components/src/schemas/**` — published-site JSON Schema; backward compatibility required

## Code review severity

The code review agent uses four severity levels:

| Severity | Definition | Blocks AI approval? |
| -------- | ---------- | ------------------- |
| **Must Fix** | Likely bug, data loss risk, broken contract between Studio and components schema | Yes |
| **Should Fix** | Pattern that will cause a bug under a realistic edge case, or misleads the next engineer | Yes |
| **Consider** | Style, minor duplication, test coverage gap | No — annotation only |
| **Pre-existing** | Issue in code not introduced by this PR | No — annotate once, never repeat |

Authors may dismiss a Should Fix finding by replying `/dismiss: <reason>`. Dismissals are logged and surfaced to the human reviewer in the AI review summary — they do not disappear silently. The agent acknowledges the dismissal and clears the block.

Test coverage delta is a soft signal only: if a PR adds significant logic with no new tests, the agent annotates it as a Consider finding regardless of tier. It never hard-blocks on coverage alone.

## Evolution

This file evolves with the codebase. When you add a new high-risk area (new auth integration, new payment path, new infra-as-code), add it to `risk:high` in the same PR. The `pr-review` skill reads this file at run time; no code change is needed to expand coverage.
