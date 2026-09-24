---
name: bugfix
description: Implement the minimal fix for an already-triaged bug, run the full test suite, and open a stacked PR via Graphite. Requires the `triage` skill to have run first.
---

# Instructions

This skill ships the fix. It assumes the `triage` skill has already produced:

- A failing test on the current branch.
- A root-cause comment on the Linear ticket.
- An "allow-list status: yes" determination per `docs/bug-automation-allowlist.md`.

If any of those is missing, abort and run `triage` first. Do not freelance a fix without a failing test.

## Procedure

### 1. Verify prerequisites

- Current branch has a failing test commit at HEAD.
- Linear ticket has the triage summary comment.
- The bug category is on the allow-list. Re-read `docs/bug-automation-allowlist.md` and confirm the category. If the category changed since `triage` ran, abort.

### 2. Pick the minimal fix

Constraints:

- **Source code change ≤ 100 LOC.** Tests don't count.
- Replace > delete. If the fix would remove more than 20 LOC of existing logic, you are not bug-fixing — you are refactoring. Abort.
- One module. The fix touches one server module *or* one feature *or* one component.
- No schema migrations.
- No new dependencies.

If you can't fit the fix inside these limits, stop. Post a Linear comment listing what's needed and hand back to a human.

### 3. Apply the fix

- Make the change on the current (triage) branch — same branch as the failing test, so the fix and the test land together.
- Reuse existing helpers and utilities. Do not introduce new abstractions for a single bug fix.
- Respect the area's `CLAUDE.md` (read it before editing). Cite the rule you're following in the PR body if non-obvious.
- Add no comments unless the *why* of the fix would surprise a future reader (see project convention).

### 4. Run the full local suite

```bash
pnpm typecheck
pnpm lint
pnpm test:unit     # from apps/studio if the change is there
```

If any check fails:

- If the failure is caused by your fix: iterate within the LOC budget.
- If the failure is unrelated and pre-existing on `main`: stop and report. Do not push.

The previously-failing test must now pass — confirm in the output before continuing.

### 5. Commit and open the PR

```bash
gt create -m "fix(<area>): <one-line summary>"
gt submit --draft
```

The PR body must contain:

```markdown
## Root cause
<paste from triage>

## Fix
<one or two sentences — what changed, why this is the minimal fix>

## Allow-list category
<category from docs/bug-automation-allowlist.md>

## Closes
<Linear ticket ID>

## Verification
- Failing test from triage now passes: <path>
- Full unit suite passes locally
- typecheck + lint pass
```

Apply labels:

- `ai-authored`
- `risk:<tier>` per `docs/risk-taxonomy.md`
- The originating `area:*` label from the Linear ticket

### 6. Post to Linear

Update the ticket with:

```markdown
## Bugfix PR opened

PR: <url>
Risk tier: <risk:low|medium>
```

## Hard rules

- **No fix without a passing-from-failing test in the same PR.**
- **Never push directly to main.** Always via `gt submit --draft`.
- **Refuse to exceed 100 LOC source change.** Escalate instead.
- **Never delete existing tests** to make CI pass. If a test is wrong, that's a separate PR.
- **Never edit `prisma/`, `src/server/trpc.ts`, `src/server/modules/auth`, or any path in `risk:high`.** Allow-list excludes these.

## Anti-patterns the agent must refuse

- Adding a "defensive" check unrelated to the failing test.
- Refactoring the file while fixing the bug ("while I was here").
- Combining two bugs into one PR.
- Disabling a flaky test to make CI green.
- Inventing a feature flag to gate the fix.
