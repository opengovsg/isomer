# One-shot vs plan-first thresholds

When the agent picks up a feature ticket, it must choose between:

- **One-shot**: skip the plan step and implement directly.
- **Plan-first**: propose 2–3 approaches with trade-offs, stop, wait for a human to pick before implementing.

This doc defines when each applies. The `feature-plan` and `feature-implement` skills read this file at run time.

## One-shot eligibility — *all* conditions must hold

1. **Type label:** `feature` or `design-iteration`.
2. **Risk:** `risk:low` per `docs/risk-taxonomy.md` (computed from the *expected diff*, not the diff after writing).
3. **Surface:**
   - Frontend-only changes, or
   - A new tRPC procedure that is a CRUD wrapper around an existing model with no new permission shape.
4. **Size budget:**
   - **FE-only:** ≤ 200 LOC of source code (tests, stories, types not counted).
   - **BE-only:** ≤ 150 LOC of source code, single module under `server/modules/<area>/`.
   - **FE + BE:** **not one-shot.** Always plan-first.
5. **No new dependencies.** Adding a package is never one-shot.
6. **No new feature flags.** Gating new behaviour requires a plan.
7. **No schema changes.** Migrations are always plan-first.
8. **A single Figma frame** (design-iteration) or a clearly bounded ticket goal (feature). Multiple frames → plan-first.

If any condition fails, the agent must run `feature-plan` first.

## Plan-first triggers — any one is enough

- The ticket is `risk:medium` or `risk:high`.
- The change crosses Studio and `packages/components` (the contract boundary — see `packages/components/CLAUDE.md`).
- The change introduces a new database table, column, or index.
- The change introduces a new tRPC router or a new module under `server/modules/`.
- The change introduces a new shared component in `apps/studio/src/components/` or `packages/components/src/`.
- The change adds a new permission shape, new auth flow, or new audit event.
- The change requires data backfill.
- The change estimated diff exceeds the one-shot LOC budget.
- The ticket is ambiguous about user-visible behaviour and the agent has more than one reasonable interpretation.

## How the agent decides

At the start of every feature run:

1. Read the Linear ticket. Validate canonical fields per `docs/ai-workflow.md`.
2. List the files the change will likely touch. Compute the max risk tier across them.
3. Apply the eligibility checks above.
4. **One-shot eligible:** start `feature-implement` directly.
5. **Plan-first:** run `feature-plan`. Post approaches to the ticket. Stop until a human picks.

If the agent starts one-shot and the diff exceeds the budget while writing, it must **stop, throw away the in-progress diff, and re-enter plan-first**. Do not silently land an over-budget one-shot.

## Why the LOC budgets exist

These numbers come from the L3 doc's design constraint: at L3 the human is shot-caller + sense-check. The smaller the diff, the smaller the sense-check. 200 LOC is roughly the upper end of "review-in-one-sitting". Above that, the right intervention is to split the work into smaller PRs, not to push a single bigger one through.

The budgets evolve. If the team finds 200 LOC is too generous (regressions slip through) or too tight (too many obvious things get held up), edit this file. Skills read it at run time, so no code change is needed.
