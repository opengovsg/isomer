# PR risk taxonomy

This doc maps file-glob heuristics and content signals → risk tier. It is the source of truth for the `/pr-review` skill and any future code-review automation.

Tiers reflect actual reversibility and blast radius: if multiple globs match a single PR, the **highest** tier wins, but content-based signals (additive-only, feature-flag gating) can lower MEDIUM → LOW.

## Tiers

| Tier         | Meaning                                                                                       | Auto-approve eligible? |
| ------------ | --------------------------------------------------------------------------------------------- | ------------- |
| `risk:low`   | Cosmetic, docs, deps, copy, pure UI, utilities. Cannot break runtime behaviour or change data. | Yes, with caveats below (flagged by `pr-review`; a human still approves). |
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

There is no bot that submits an actual GitHub APPROVE review — the `pr-review` skill only flags eligibility in its comment as a signal for human reviewers. It marks a `risk:low` PR eligible only when **all** of the following hold:

1. The PR touches no file outside the `risk:low` globs.
2. CI is green (lint, typecheck, build, tests).
3. Code review (human, since there is no automated code-review skill) surfaces no blocking issues.
4. Security review (human, since there is no automated security-review skill) surfaces no blocking issues.
5. The PR does not change `package.json` scripts, `engines`, `pnpm.overrides`, or workspace dependencies.
6. No reversibility modifier applies (external side-effects, row mutations, pgboss handler removal/rename/payload change, S3 object deletions).

If any condition fails, `pr-review` marks the PR "human review required" and leaves an annotation explaining why. A human always clicks approve and merge.

## Hot paths to flag (any tier)

Even within `risk:medium`, the following sub-paths are "hot" and should be called out by the `pr-review` skill with a banner:

- `apps/studio/src/server/modules/page/page.service.ts` — publish + scheduled publish flow
- `apps/studio/src/server/modules/resource/**` — resource graph mutations
- `apps/studio/src/features/editing-experience/**` — the editor core; any change risks publisher data loss
- `packages/components/src/schemas/**` — published-site JSON Schema; backward compatibility required

## Evolution

This file evolves with the codebase. When you add a new high-risk area (new auth integration, new payment path, new infra-as-code), add it to `risk:high` in the same PR. The `pr-review` skill reads this file at run time; no code change is needed to expand coverage.
