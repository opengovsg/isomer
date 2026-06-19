---
name: code-review
description: Code-review a pull request for bugs, anti-patterns, and convention violations. Posts a structured comment with severity-tagged findings and writes /tmp/review-result.json for CI consumption. Does not compute risk tier (use /compute-risk-tier for that) and does not approve or merge.
---

# Instructions

Review the pull request for code quality issues. This skill is used both locally and from CI — the `/tmp/review-result.json` output is always written so CI can gate on it.

## Inputs

- `docs/risk-taxonomy.md` — severity levels, hot paths, and escalation rules. **Read at run time.**
- All `CLAUDE.md` files under directories touched by the diff.
- The PR diff — fetched via `gh pr diff`.
- Optional argument: a PR number. If provided, use it. Otherwise detect via `gh pr view --json number -q .number`.

## Procedure

1. **Resolve the PR number.** If an argument was passed (e.g. `/code-review 123`), use it. Otherwise run:

   ```
   gh pr view --json number -q .number
   ```

2. **Get the diff** (file names are derivable from `diff --git` headers in the output).

   ```
   gh pr diff <number>
   ```

3. **Load context.** Read `docs/risk-taxonomy.md` (for hot paths and severity definitions) and any `CLAUDE.md` files in directories touched by the diff.

4. **Review each changed file** and identify issues by severity:

   | Severity            | Definition                                                                       |
   | ------------------- | -------------------------------------------------------------------------------- |
   | 🔴 **Must Fix**     | Likely bug, data loss risk, broken contract between Studio and components schema |
   | 💬 **Consider**     | Style, minor duplication, test coverage gap, or doc inaccuracy that is annoying but doesn't break anything (e.g. process doc slightly ahead of implementation) |
   | ⚪ **Pre-existing** | Issue in code not introduced by this PR — note once, never repeat                |

   **Hot-path escalation** — bump findings in these paths by one severity level (Consider→Must Fix):
   - `apps/studio/src/server/modules/page/page.service.ts`
   - `apps/studio/src/server/modules/resource/`
   - `apps/studio/src/features/editing-experience/`
   - `packages/components/src/schemas/`

5. **Convention scan.** For each touched directory with a `CLAUDE.md`, check for violations. Cite `file:line`.

6. **Coverage scan.**
   - Touched `apps/studio/src/server/modules/**` without a `__tests__/` change → Consider finding.
   - Touched `packages/components/src/templates/**/components/**` without a `*.stories.tsx` change → Consider finding.
   - New tRPC procedure without an input schema in `apps/studio/src/schemas/` → Must Fix finding.

7. **Post a review comment always:**

   ```
   gh pr review <number> --comment --body "<structured markdown>"
   ```

   Always start the comment with a summary line showing the must-fix and consideration counts, e.g.:
   `🔴 Must Fix: 2 · 💬 Considerations: 3` or `✅ No blocking issues (💬 3 considerations)`.
   Group findings by file. Use severity prefixes. Always include clearly titled sections for each category present (Must Fix, Considerations) — never omit a section heading just because it has few items.
   End every comment with the footer: `<sub>Posted by [🤖 IsoBot: PR Review](<repo_url>/blob/main/.github/workflows/isobot-pr-review.yml)</sub>`

8. **Write result** to `/tmp/review-result.json`:
   ```json
   {"blocking": <true if any Must Fix findings, else false>, "must_fix": <count>}
   ```
   If the diff is clean: `{"blocking": false, "must_fix": 0}`

## Comment format

```markdown
## 🤖 Code review

> 🔴 Must Fix: N · 💬 Considerations: N

### Must Fix

### `path/to/file.ts`

- 🔴 Must Fix: <finding> (line N)

### Considerations

### `path/to/other.ts`

- 💬 Consider: <finding>

<sub>Posted by [🤖 IsoBot: PR Review](<repo_url>/blob/main/.github/workflows/isobot-pr-review.yml)</sub>
```

When the diff is clean, use:

```markdown
## 🤖 Code review

✅ No blocking issues found.

> 🔴 Must Fix: 0 · 💬 Considerations: 0

<sub>Posted by [🤖 IsoBot: PR Review](<repo_url>/blob/main/.github/workflows/isobot-pr-review.yml)</sub>
```

## Hard rules

- **Never approve, never request changes, never merge.** Comments only.
- **Read docs/risk-taxonomy.md and CLAUDE.md files at run time.** Do not use cached assumptions.
- **Cite file:line for every Must Fix and Should Fix.** Vague findings are worse than no findings.
- **Do not summarise the diff** — that is the PR description's job.
- **Pre-existing issues: note once only.** Do not repeat them on re-runs.
- **Always post a comment** — either findings or a clean pass. A summary line is required every time.

## Failure modes

- Diff has 0 files → post clean pass comment, write `{"blocking": false, "must_fix": 0, "should_fix": 0}`, and exit.
- `docs/risk-taxonomy.md` missing → post a comment noting this and write `{"blocking": true, "must_fix": 0, "should_fix": 0}` (conservative fail-open).
- PR number cannot be resolved → abort with a clear error.
