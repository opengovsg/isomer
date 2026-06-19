# AI-assisted workflow — canonical inputs

This doc defines the **canonical contract** between humans, Linear, Figma, and any AI agent that triages or implements work in this repo. Triggers (webhooks, MCP fetches) read these fields; if they're missing or malformed, the agent must stop and ask rather than guess.

If you change a field name or label here, you must also update the corresponding skill / webhook handler. Treat this doc as the source of truth.

## Linear ticket fields

Every ticket that an agent may pick up **must** carry the following:

| Field             | Required for                | Notes                                                            |
| ----------------- | --------------------------- | ---------------------------------------------------------------- |
| `Title`           | all                         | Imperative, scoped. No "investigate X" titles for bugs.          |
| `Description`     | all                         | Markdown. Sections below.                                        |
| `Area` label      | all                         | One of: `area:studio`, `area:components`, `area:infra`, `area:db`. Drives which `CLAUDE.md` files the agent loads. |
| `Type` label      | all                         | One of: `bug`, `feature`, `chore`, `design-iteration`.           |
| `Risk` label      | feature, chore              | One of: `risk:low`, `risk:medium`, `risk:high`. Bugs are graded by the agent. |
| `Trigger` label   | agent-eligible tickets only | `ai:triage` (let agent triage), `ai:implement` (let agent ship a PR). Absence = agent must not act. |
| Figma frame URL   | features, design-iteration  | Paste the frame URL in the description. Frame must be named, not "Frame 47". |
| Repro steps       | bugs                        | Numbered list in description.                                    |
| Expected / actual | bugs                        | Two sub-headings in description.                                 |

Anything else (priority, cycle, assignee) is for humans; agents ignore it.

### Description template — bug

```markdown
## Repro
1. ...
2. ...

## Expected
...

## Actual
...

## Environment
- Browser / OS / role
```

### Description template — feature

```markdown
## Goal
One sentence. What outcome the user gets.

## Design
- Figma frame: https://figma.com/...
- Target location: `apps/studio/src/.../Foo.tsx` (or "new component in packages/components/src/templates/...")

## Constraints
- Must use existing design tokens
- ...

## Out of scope
- ...
```

### Description template — design-iteration

Used when a designer wants the agent to update an already-implemented component to match a new Figma frame.

```markdown
## Component
`apps/studio/src/components/Foo/Bar.tsx`

## Target frame
https://figma.com/...

## Changes from current
- Header padding: 12 → 16
- Primary CTA: solid → ghost
```

## Figma conventions

For an agent to read a frame reliably:

- **Frame names must be human-readable.** `Dashboard / Empty state` is fine; `Frame 47` is not — the agent will refuse.
- **Components used in the frame must exist in our design library** or be flagged as "new primitive — needs eng review" in the description.
- **Spacing/sizing should reference tokens** when present. If a value is hardcoded, the agent will ask before using a magic number.

## Automated PR pipeline

Every PR triggers a three-stage automated pipeline via GitHub Actions. Stages run as separate check runs so their signals are distinct in the PR UI.

### Stage 1 — Risk labeling (triggers: `opened`, `synchronize`, `/re-review`)

Runs on every push and on `/re-review` comments. Uses the `/compute-risk-tier` skill (LLM-powered) which reads `docs/risk-taxonomy.md`, diffs the PR, applies file-glob rules and reversibility modifiers, and sets the `risk:low / risk:medium / risk:high` label. Also re-runs when `/re-review` is commented so the label is always current at review time.

### Stage 2 — Code review + security review (triggers: `ready_for_review`, `/re-review`)

Runs when the author marks the PR ready, or when they comment `/re-review` after pushing fixes. Does not run on `synchronize` — engineers should keep the PR in draft while iterating and mark ready only when they want a review. Three parallel jobs:

**Risk tier** (`/compute-risk-tier` skill): re-computes tier at review time for the auto-approve gate. Falls back to `high` if the skill fails, keeping the gate conservative.

**Code review** (`/pr-review` skill):
- Posts severity-tagged findings (Must Fix / Should Fix / Consider / Pre-existing)
- Authors may dismiss Should Fix with `/dismiss: <reason>` — logged and surfaced to human reviewer
- Hot-path files escalate findings by one severity level (see `docs/risk-taxonomy.md`)
- Writes `/tmp/review-result.json` for the auto-approve gate

**Security review** (`/security-review` skill):
- Covers: IDOR, missing auth middleware on new routes, overly broad permission grants, XSS vectors, unvalidated external input reaching Prisma, missing audit events on sensitive mutations, Mockpass integration surface, S3/CDN signed URL handling
- Separate check run — always visible even when code review is clean
- Writes `/tmp/security-result.json` for the auto-approve gate

### Stage 3 — CI autofix (triggers: CI failure on any push)

If `lint`, `format`, `build`, or `typecheck` CI jobs fail, the autofix agent:

1. Commits a fix directly to the PR branch (authored by bot identity)
2. CI re-runs automatically
3. Caps at **3 attempts** — if still failing after 3 turns, posts a comment with the error and stops

Constraints: the agent must never suppress lint rules (`// oxlint-disable`, `// eslint-disable`, ignore config changes). If the only valid fix is a suppression, it comments and stops. Unit and E2E test failures are **never autofixed** — the agent annotates only.

### Bot approval for `risk:low` PRs

When both the code review and security review check runs pass clean (no Must Fix or Should Fix findings) and the PR meets all auto-approve conditions in `docs/risk-taxonomy.md`, the pipeline submits a formal GitHub APPROVE review via the bot identity. This counts toward required-approvals branch protection. A human still clicks merge.

For `risk:medium` and `risk:high` PRs, the pipeline comments only — human approval required.

### Convention: request human review only after pipeline clears

The expected workflow:

1. Author opens PR → risk label applied automatically
2. Author marks ready for review → code review + security review run
3. Author resolves Must Fix / Should Fix findings (or dismisses with reason)
4. Pipeline re-runs → if clean, bot approves (`risk:low`) or signals ready for human (`risk:medium/high`)
5. Author requests human reviewer

Humans _can_ review earlier, but the convention is: don't tag a reviewer until the pipeline has cleared. The `risk:*` label and check run status are the signal.

## GitHub PR conventions

When the agent opens a PR, it must:

1. Link the originating Linear ticket in the PR body (first line: `Closes ENG-123`).
2. Tag the PR with `ai-authored` (label).
3. Add a risk tier label (`risk:low` / `risk:medium` / `risk:high`) — applied automatically by `🤖 PR: Risk Label` on every push.
4. Use a stacked branch via Graphite when the change spans more than one concern (see [CONTRIBUTING.md](../CONTRIBUTING.md#stacked-prs-with-graphite)).
5. Include a **Root cause** section (bugs) or **Approach** section (features) in the PR body.

## Slack / notifications

- Bug PRs → `#isomer-eng-reviews` channel
- Design iterations → `#isomer-design-reviews` channel, with the Chromatic preview link inline
- Incident diagnoses → the incident channel for the firing monitor (see runbooks)

## When the agent must stop and ask

- A required field above is missing or malformed.
- The ticket is labelled `risk:high` but the agent only has `ai:triage` permission (it can investigate but not open an implementing PR).
- The area label points to a directory without a `CLAUDE.md` covering its conventions.
- The Figma frame references a component not present in `packages/components/src/`.

Stopping looks like: post a Linear comment listing what's missing, mark the ticket back to the human in the triage column. Never guess.
