---
name: feature-implement
description: Implement a feature ticket. Hard guardrails — Storybook (FE) or tRPC test (BE) required, area conventions enforced via CLAUDE.md, stacked PRs via Graphite. Picks up from `feature-plan` or one-shot when eligible.
---

# Instructions

This skill ships feature code. It enters from one of two paths:

- **One-shot path**: the ticket qualifies under `docs/oneshot-vs-plan-threshold.md` and there is no `feature-plan` comment.
- **Plan-first path**: a human replied `pick: A|B|C` to a `feature-plan` comment on the ticket.

If you find yourself in this skill without one of those preconditions, abort and run `feature-plan`.

## Inputs

- The Linear ticket and (if applicable) the picked approach.
- The Figma frame URL when relevant.
- `docs/ai-workflow.md`, `docs/risk-taxonomy.md`, `docs/oneshot-vs-plan-threshold.md`.
- All `CLAUDE.md` files in directories the change will touch — **read these before editing**.

## Procedure

### 1. Validate entry conditions

- Linear ticket has the canonical fields.
- Either: ticket is one-shot eligible per `docs/oneshot-vs-plan-threshold.md`, **or** there's a `pick:` reply on a `feature-plan` comment.
- The picked approach (if plan-first) is still implementable on top of current `main`. If `main` moved in a way that invalidates the plan, re-run `feature-plan`.

### 2. Read the area conventions

For every directory you intend to edit, read its `CLAUDE.md`. Quote the relevant rules in your internal scratchpad. Plan the implementation against those rules — do not edit first and reconcile after.

Particular files to re-read every time:

- `apps/studio/src/server/CLAUDE.md` if touching the server
- `apps/studio/src/features/CLAUDE.md` if touching a feature
- `packages/components/CLAUDE.md` if touching the published-site renderer
- `apps/studio/prisma/CLAUDE.md` if touching the schema

### 3. Stack the work

A feature lands as a Graphite stack of small PRs, not one big PR. Default split:

1. **Schema / interface PR.** Type, Zod schema, JSON schema additions. Backward compatible.
2. **Server PR.** New procedure, service, tests. Wires the new behaviour but is unreachable from the UI.
3. **Client PR.** Hooks, components, page wiring. The user-visible change.
4. **Story / Chromatic PR.** Storybook stories for FE work.

If the change is one-shot eligible and trivially small (e.g. a single component update for design-iteration), one PR is OK.

For each PR in the stack:

```bash
gt create -m "<conventional commit message scoped to that PR>"
```

### 4. Implement against the rules

While writing:

- Reuse existing helpers and primitives. Adding a new abstraction needs a justification one of: existing approach is fundamentally broken, three callers already exist, the convention doc calls for it.
- No new dependencies without explicit ticket approval.
- No new feature flags without explicit ticket approval.
- Follow the area `CLAUDE.md` literally. If a rule there is wrong, the right move is to update that file in a separate PR, not to silently violate it.
- Add no comments except where the *why* of the code is non-obvious. Don't narrate the code.

### 5. Required artefacts per area

**Frontend (`apps/studio/src/features/**`, `apps/studio/src/components/**`, `packages/components/src/templates/**`):**

- A Storybook story covering empty, populated, and (where applicable) error states.
- A component test if the component has interactive logic.

**Backend (`apps/studio/src/server/modules/**`):**

- A tRPC integration test using `createCallerFactory` — at least happy path + one permission-denied path.
- An audit log call for every state mutation.
- A rate limit `.meta()` for any procedure that triggers external side effects.

**Schema (`apps/studio/src/schemas/**`, `packages/components/src/schemas/**`):**

- User-facing `message` strings on every constraint.
- A unit test for any schema with conditional rules.

These are guardrails, not suggestions. A PR without the required artefact must not be opened.

### 6. Verify locally

For each PR in the stack, before `gt submit`:

```bash
pnpm typecheck
pnpm lint
pnpm test:unit       # from apps/studio
```

For FE-only changes, also build Storybook to make sure stories render:

```bash
pnpm storybook       # from the relevant workspace, verify visually
```

If anything fails, fix on the current branch — do not move up the stack with red CI.

### 7. Submit the stack

```bash
gt submit --stack --draft
```

For each PR:

- Body must follow the template below.
- Labels: `ai-authored`, `risk:<tier>` per `docs/risk-taxonomy.md`, `area:<name>` from the Linear ticket.
- Link the Linear ticket on the bottom PR (`Closes ENG-123`).
- The middle PRs reference the bottom one ("part of stack starting at #N").

PR body template:

```markdown
## Goal
<one sentence from the ticket>

## Approach
<which approach from feature-plan, or "one-shot" with the reason>

## What this PR does
<this PR's slice only — not the whole feature>

## Stack
- PR #N (this one) — <slice>
- PR #N+1 — <slice>
- ...

## Verification
- [ ] typecheck / lint / unit pass
- [ ] Storybook story added (FE)
- [ ] tRPC integration test added (BE)
- [ ] Chromatic preview link (FE, after CI builds)

## Closes
<ticket id on the bottom PR only>
```

### 8. Post back to Linear

Update the ticket:

```markdown
## Feature PRs opened

Stack:
- PR #N — <slice>
- PR #N+1 — <slice>

Risk: <tier>
Awaiting: <review or design sign-off>
```

If this is a `design-iteration` and Chromatic is wired up, attach the preview link.

## Hard rules

- **Required artefacts are not optional.** No PR without the corresponding test / story.
- **Stack, don't bundle.** A feature touching three layers ships as three PRs.
- **Read every relevant `CLAUDE.md` before editing.** Don't reconstruct conventions from memory.
- **No new dependencies, no new feature flags** without explicit ticket approval.
- **Never amend or force-push the bottom of the stack** after later PRs land in review.
- **Stop and re-plan** if the diff balloons past the planned LOC estimate by 2×.

## Anti-patterns the agent must refuse

- Combining FE + BE + schema changes into one PR.
- Skipping the Storybook story because "the change is obvious".
- Mocking the database in BE integration tests.
- Adding `// TODO` markers without an attached follow-up ticket.
- Editing `CLAUDE.md` to make a rule fit your implementation choice.
- Squashing the stack into one branch before submitting.
