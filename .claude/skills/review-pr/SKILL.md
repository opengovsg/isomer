---
name: review-pr
description: Review the current pull request as a senior engineer — security, correctness, maintainability — and post a structured review comment to the PR. Does not approve or merge.
---

# Instructions

Review the current pull request with the eye of a senior engineer doing a thorough code review. Post one structured comment to the PR via `gh pr comment`. Never approve, request changes via the GitHub review API, or merge.

## Inputs

- The current branch's diff against `main`.
- All `CLAUDE.md` files under directories touched by the diff.
- `docs/risk-taxonomy.md` if it exists — use it to gauge risk tier.

## Procedure

1. **Get the diff.** Run `git diff origin/main...HEAD` to see all changes. If on `main` or the diff is empty, post a comment saying there is nothing to review and exit.
2. **Read context.** For each directory touched by the diff, read any `CLAUDE.md` present.
3. **Review across four lenses:**
   - **Correctness** — bugs, off-by-ones, unhandled edge cases, incorrect logic.
   - **Security** — injection risks, unvalidated inputs at system boundaries, exposed secrets, broken auth/authz.
   - **Maintainability** — naming clarity, unnecessary complexity, missing or misleading comments, test coverage gaps.
   - **Conventions** — violations of rules documented in `CLAUDE.md` files in the touched directories.
4. **Post the review comment** using `gh pr comment --body "..."` on the current PR number (derive from `gh pr view --json number -q .number`).

## Output format

```markdown
## 🔍 Code Review

### Summary
<1–3 sentence overall assessment>

### Findings

| Severity | Location | Finding |
|----------|----------|---------|
| 🔴 Critical | `path/to/file.ts:42` | <description> |
| 🟡 Warning  | `path/to/file.ts:88` | <description> |
| 🔵 Nit      | `path/to/file.ts:12` | <description> |

*(omit table entirely if no findings)*

### Positive observations
- <what was done well — omit section if nothing notable>

### Suggested follow-ups
- <optional improvements beyond the scope of this PR — omit if none>
```

Severity guide:
- 🔴 Critical — correctness bug, security vulnerability, or convention violation that must be fixed before merge.
- 🟡 Warning — likely problem or significant maintainability concern; strongly recommended to fix.
- 🔵 Nit — minor style or clarity issue; author's discretion.

## Hard rules

- **Never approve, never request changes via the GitHub review API, never merge.**
- **Cite `file:line` for every finding.** Vague findings are worse than no findings.
- **Do not summarise the diff.** The PR description does that. Focus on what could go wrong.
- **Only flag things grounded in the diff or a `CLAUDE.md` rule.** No speculative concerns.
- **Keep each finding under two lines.**
