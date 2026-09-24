---
name: triage
description: Triage a bug from a Linear ticket — reproduce, locate suspect code, write a failing test. Stops before fixing. Use as the first step of any bug-driven agent run.
---

# Instructions

This skill triages a bug. It does **not** fix it. The output is a failing test + a root-cause writeup posted to the Linear ticket. If the bug is in the allow-list at `docs/bug-automation-allowlist.md`, the `bugfix` skill picks up from here; otherwise a human takes over.

## Inputs

- A Linear ticket ID (or a ticket payload from the agent runner).
- The repo at HEAD of `main`.
- `docs/ai-workflow.md` for canonical Linear field validation.

## Procedure

### 1. Validate the ticket

Read the ticket. Verify the canonical fields per `docs/ai-workflow.md`:

- `area:*` label present
- `bug` type label present
- Description contains `## Repro`, `## Expected`, `## Actual`

If any field is missing, post a Linear comment listing what's missing and stop. Do not guess.

### 2. Reproduce

Pick the most direct repro environment:

- For UI bugs: spin up `pnpm dev` and follow the repro steps. Use the dev tools to capture the failing state.
- For server bugs: write a Vitest test that exercises the failing path using the `createCallerFactory` from `~/server/trpc`.
- For DB bugs: use `pnpm services:setup` to get a real Postgres, then write the failing test against it.

If you can't reproduce in 3 attempts:

- Post a Linear comment listing what you tried (commands, inputs, environment).
- Ask the reporter for the missing detail (likely environment / role / data shape).
- Stop. Do not invent a repro.

### 3. Locate the suspect

Start from the user-visible symptom and walk **outward**:

1. Find the React component / tRPC procedure that the user is interacting with.
2. Trace its call chain into the service layer.
3. Identify the smallest code unit (often a function) where expected and actual diverge.

Cite file:line for every step in your trace — the engineer reviewer needs to retrace it.

### 4. Write the failing test

The failing test is the deliverable. It must:

- Live next to the suspect code (`__tests__/` for server, alongside the file for components).
- Fail **only** because of this bug. If you have to fix two things to make it pass, you've conflated bugs — split the ticket.
- Assert the user-visible expected behaviour, not the internal mechanism.
- Be deterministic. Flaky tests in this slot are a hard failure.

Commit the failing test on a new branch via `gt create -m "test(<area>): failing test for <ticket-id>"`. The test is committed *failing*; CI on the draft PR will show red. That's intentional.

### 5. Write the root-cause summary

Post a Linear comment on the ticket with:

```markdown
## Triage — <ticket-id>

**Repro**: <one line>
**Suspect**: <file:line>
**Root cause**: <one sentence>
**Failing test**: <branch + path>
**Allow-list status**: yes (category: <name>) | no — <reason>

**Trace**:
- <step 1, with file:line>
- <step 2>
- ...
```

### 6. Hand off

- If allow-list status is **yes**: invoke the `bugfix` skill on the same branch.
- If **no**: convert the branch to a draft PR, link the Linear ticket, label `risk:<tier>` per `docs/risk-taxonomy.md`, and post to the channel from `docs/ai-workflow.md`.

## Hard rules

- **Never fix in this skill.** If you find yourself editing source code, stop — that's the `bugfix` skill's job.
- **Never invent a repro.** If you can't reproduce, escalate to the reporter.
- **Failing test before anything else.** No PR without a failing test on the branch.
- **One bug per branch.** If repro surfaces a second bug, file a separate Linear ticket and continue with the original.
- **Cite file:line for every claim** in the trace.

## Anti-patterns the agent must refuse

- Posting a "probably caused by X" comment without a failing test.
- Combining triage + fix in one commit.
- Skipping the canonical field check because the ticket "looks fine".
- Writing a test that asserts internal implementation details rather than user-visible behaviour.
