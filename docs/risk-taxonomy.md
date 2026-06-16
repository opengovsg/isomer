# PR risk taxonomy

This doc maps file-glob heuristics → risk tier. It is the source of truth for the `pr-review` skill, the auto-approve gate, and any future code-review automation.

Tiers are conservative on purpose: if multiple globs match a single PR, the **highest** tier wins.

## Tiers

| Tier         | Meaning                                                                                       | Auto-approve? |
| ------------ | --------------------------------------------------------------------------------------------- | ------------- |
| `risk:low`   | Cosmetic, docs, deps, copy. Cannot break runtime behaviour or change data.                    | Yes, with caveats below. |
| `risk:medium`| Adds or changes app behaviour but in a contained area. Requires human approve.                | No.           |
| `risk:high`  | Touches security, auth, billing, migrations, infra, or cross-cutting code. Requires human approve + a tagged reviewer. | No.           |

## File-glob → tier

Match top-down — the first matching glob wins for that file. The PR's tier is the max across its files.

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
- `apps/studio/src/lib/growthbook*` (feature flag definitions)
- `apps/studio/src/env.mjs`
- `.github/workflows/**`
- `tooling/**` (shared configs)
- `**/seed.ts`
- `infrastructure/**` (if/when added)

### `risk:medium`

- `apps/studio/src/server/modules/**` (all other modules)
- `apps/studio/src/pages/api/**`
- `apps/studio/src/features/**`
- `apps/studio/src/schemas/**`
- `apps/studio/src/hooks/**`
- `apps/studio/src/lib/**`
- `apps/studio/src/utils/**`
- `apps/studio/src/components/**`
- `packages/components/src/templates/**`
- `packages/components/src/schemas/**`
- `packages/components/src/engine/**`
- `packages/pgboss/**`, `packages/redis/**`, `packages/logging/**`, `packages/validators/**`

### `risk:low`

- `**/*.md`, `**/*.mdx`
- `docs/**`
- `**/CLAUDE.md`
- `**/*.stories.tsx`, `**/stories/**`
- `**/__tests__/**`, `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`
- `package.json` for dependency-only diffs from Dependabot or Renovate (no script changes)
- `pnpm-lock.yaml` paired with a dep-only `package.json` change
- `apps/studio/src/constants/**` for copy / strings only (no logic)
- `**/i18n/**`, `**/locales/**`

## Auto-approve caveats

`risk:low` is *eligible* for auto-approve. It is auto-approved only when **all** of the following hold:

1. The author is on the explicit allow-list (initially: Dependabot, Renovate, and the agent's GitHub identity).
2. The PR touches no file outside the `risk:low` globs.
3. CI is green (lint, typecheck, build, tests).
4. The PR carries the `ai-authored` label or comes from a known bot.
5. The PR does not change `package.json` scripts, `engines`, `pnpm.overrides`, or workspace dependencies.

If any condition fails, the PR is downgraded to "human review required" and the agent leaves an annotation explaining why.

## Hot paths to flag (any tier)

Even within `risk:medium`, the following sub-paths are "hot" and should be called out by the `pr-review` skill with a banner:

- `apps/studio/src/server/modules/page/page.service.ts` — publish + scheduled publish flow
- `apps/studio/src/server/modules/resource/**` — resource graph mutations
- `apps/studio/src/features/editing-experience/**` — the editor core; any change risks publisher data loss
- `packages/components/src/schemas/**` — published-site JSON Schema; backward compatibility required

## Evolution

This file evolves with the codebase. When you add a new high-risk area (new auth integration, new payment path, new infra-as-code), add it to `risk:high` in the same PR. The `pr-review` skill reads this file at run time; no code change is needed to expand coverage.
