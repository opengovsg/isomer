---
name: write-e2e-tests
description: Suggests and writes Playwright E2E tests for Studio features following repo conventions. Use when adding E2E coverage, planning tests for a feature or PR, or when the user asks what E2E tests to write for their branch.
---

# Write E2E tests

Helps plan and implement Playwright E2E tests in `apps/studio/tests/e2e/`.
Always follow the living conventions in
[`.claude/skills/isomer-conventions/conventions/e2e-tests.md`](../isomer-conventions/conventions/e2e-tests.md)
and onboarding notes in `apps/studio/tests/e2e/README.md`.

## Entry

Triggered when the user wants E2E test ideas, a test plan, or implementation
for a feature — on the current branch, in a PR, or for work they describe.

**Default:** if the user does not describe the feature, infer it from the
current branch (diff vs base, changed files, PR title/body). State what you
inferred and ask them to confirm or correct before implementing.

## Procedure

### 1. Understand the feature

Gather context from the highest-signal source available:

| Source | What to read |
| ------ | ------------ |
| User description | Surfaces touched, roles, happy path, edge cases |
| `git diff` / PR diff | Changed `features/`, `pages/`, `server/modules/`, new routes |
| Existing tests in the module | `apps/studio/tests/e2e/<module>/` — avoid duplicating coverage |
| Router integration tests | `__tests__/<module>.router.test.ts` — map `describe` blocks to UI surfaces, but do **not** port validation/audit scenarios |

Identify:

- **UI surfaces** — settings page, modal, dashboard view, editor flow, wizard step
- **Roles** — who can use it (admin, editor, publisher, …)
- **Permission boundaries** — hidden control, redirect, disabled action, publish gate
- **Persisted state** — what should survive reload / appear in DB
- **Multi-step flows** — wizards, invites, publish pipelines

### 2. Load conventions

Read before suggesting or writing anything:

1. [e2e-tests.md](../isomer-conventions/conventions/e2e-tests.md) — file layout, fixture layers, PO rules, smells
2. [tests-arrange-act-assert.md](../isomer-conventions/conventions/tests-arrange-act-assert.md) — AAA comments in test bodies
3. Skim `apps/studio/tests/e2e/README.md` — fixture imports, role projects, what stays in integration tests

### 3. Suggest tests (required output)

Post a **test plan** before writing code unless the user asked only for
suggestions. Use this structure:

```markdown
## E2E test plan — <feature / branch>

**Inferred scope:** <one sentence — cite changed paths or PR>
**Module folder:** `tests/e2e/<module>/`
**New file(s):** `<surface>.test.ts` (or extend `<existing>.test.ts`)

### Suggested tests

| # | Test title | Role(s) | Type | File | Notes |
|---|------------|---------|------|------|-------|
| 1 | … | admin | happy path | … | PO: `DashboardPO` |
| 2 | … | editor | permission | … | expect hidden control |
| … | | | | | |

### Fixture / PO work

- [ ] New PO method in `fixtures/po/…` — …
- [ ] Helper in `fixtures/helpers.ts` — …
- [ ] `fixtures/<entity>/expect.ts` — …

### Out of scope (integration tests)

- <validation error codes, audit log rows, server-only side effects>

### Open questions

- <anything unclear from the diff — ask the user>
```

**Suggestion rules** (from repo practice):

| Cover in E2E | Do **not** cover in E2E |
| ------------ | ----------------------- |
| User-visible happy paths (create, edit, save, publish, toast) | Zod validation error messages |
| Permission signals in the UI (hidden/disabled/redirect) | Audit log entries |
| Persisted settings / resource state after UI action | Internal tRPC error codes |
| Cross-page flows users actually perform | Scenarios already asserted in integration tests |

**Permission tests:** add when the UI exposes a boundary. Reuse an existing
`*-permissions.test.ts` in the module when one already covers the same gate
pattern. For settings **Publish** buttons, extend
`PUBLISH_GATED_SETTINGS_SECTIONS` in `fixtures/po/site-settings.ts` and
`site/settings-permissions.test.ts` — do not duplicate gate tests in happy-path
settings files.

**Roles:** one `test.describe` per role with `{ tag: roleTag("<role>") }`.
Provision the site with the roles needed in `beforeAll`.

**Serial mode:** when 2+ tests in the same `describe` mutate the same `siteId`
settings, flag `test.describe.configure({ mode: "serial" })` in the plan.

### 4. Ask before implementing

After posting the plan:

- If scope is ambiguous, ask 1–2 focused questions (roles, publish gate, which
  surface is primary).
- If the user wants suggestions only, stop here.
- If they want implementation, proceed to step 5.

### 5. Implement

For each planned test file:

```
Task progress:
- [ ] PO / helper / fixture methods (no `page.*` in `*.test.ts` except allowlist)
- [ ] `provisionE2ESite` in `beforeAll`; `ensureUserOnboarded` in `beforeEach`
- [ ] Track created IDs; `afterEach` cleanup by ID (not title prefix)
- [ ] AAA comments in each test
- [ ] `roleTag` on role describes
- [ ] Lint passes (`pnpm lint` from repo root)
```

**File placement:**

- `tests/e2e/<module>/<surface>.test.ts` — one file per UI surface
- Page editor: `page/flows/`, `page/settings/`, or `page/blocks/` per README shard rules
- Cross-cutting dashboard/nav tests: `dashboard/` topic folder

**Run locally** (from `apps/studio`):

```bash
pnpm exec playwright test tests/e2e/<module>/<file>.test.ts --project=<role>
```

Use `--project=admin` (or the relevant role) matching the `describe` under test.

### 6. Verify

Before claiming done:

```bash
pnpm lint    # catches isomer-e2e PO/page.* violations
```

Run the new spec file against the role project(s) it tags. Fix lint and flake
before committing.

## Hard rules

- **Read e2e-tests.md first** — conventions are partially enforced by
  `eslint-plugin-isomer-e2e`; violating them fails CI.
- **Suggest before writing** unless the user explicitly asked to implement
  immediately.
- **Infer from branch/PR when unsaid** — do not ask "what feature?" without
  checking the diff first.
- **No `page.*` in test files** outside the documented allowlist — add PO/helper
  methods first.
- **No integration-test scenarios in E2E** — point those to router tests instead.

## Examples

**User:** "What E2E tests should I add?" (on a branch touching `features/users/`)

1. Diff shows new "resend invite" button on collaborators page.
2. Post plan: happy path (admin resends → toast), permission (editor cannot see
   button), extend `UsersPO` with `resendInvite()`.
3. Ask if vendor-invite edge cases are in scope; wait for confirmation.

**User:** "Add E2E tests for the footer settings changes in this PR"

1. Read PR diff → `settings-footer.test.ts` already exists.
2. Plan extends existing file + serial mode (mutates same site settings).
3. Implement PO changes, run `--project=admin`.
