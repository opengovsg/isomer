---
name: review-dependency-upgrade
description: Use this skill when the user asks to review, evaluate, or assess a dependency upgrade — e.g. "review this upgrade", "is bumping X from a.b.c to x.y.z safe?", "what breaks if I upgrade <pkg>?", "check this package bump". Covers pnpm/npm packages and github-actions. Researches breaking changes for every intermediate version and reports which ones actually impact the user's codebase. Also runs unattended on Dependabot PRs via GitHub Actions — no human in the loop.
version: 0.2.0
---

# Review Dependency Upgrade

Assess whether upgrading a dependency will break the user's codebase. Walk every intermediate version, list breaking changes, and cross-check each against actual usage.

## Automation context

This skill is invoked **unattended** by `.github/workflows/claude_dependabot_autofix.yml` on Dependabot PR open. There is no human to answer questions, approve steps, or pick options. **Run to completion every time** — infer missing inputs, make reasonable defaults, post the report, and exit.

**Hard rules for automation:**

- **Never ask the user for clarification, confirmation, or approval.** Not in chat, not as a PR comment question.
- **Never pause or offer choices** ("which PR?", "focus on one major?", "shall I continue?"). Decide and proceed.
- **Never modify the repo** — review and comment only (see Guidelines).
- **Always post the report** as a PR comment when running in CI (see step 5).

## Inputs to resolve

Before researching, determine:

1. **Name** — npm package (e.g. `next`) or github-actions action (e.g. `actions/checkout`)
2. **From version** — the version currently in use
3. **To version** — the target version

Infer from the repo and PR context — in this order:

1. **PR diff** — `gh pr diff` or `git diff main...HEAD` for `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `.github/workflows/` / `.github/actions/` changes.
2. **Dependabot PR metadata** — `gh pr view --json title,body` (titles like `Bump <pkg> from <from> to <to>`).
3. **Lockfile / manifest** — `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`.
4. **github-actions** — `uses:` lines in `.github/workflows/` and `.github/actions/` (SHA + version comment, e.g. `# v6.0.2`).

**When inference is ambiguous, pick the best match and continue.** Note assumptions in the report header under `**Assumptions:**` (one line). Examples:

- Multiple packages in one PR → review each in separate table sections in one comment.
- Version range spans many majors → cover all majors; do not truncate or ask to narrow scope.
- Changelog unavailable → report that explicitly; verdict is `NEEDS REVIEW`.
- Cannot identify any package → post a short PR comment stating what was checked and that no upgrade could be inferred; do not ask follow-up questions.

## Procedure

### 1. Enumerate intermediate versions

List every major and minor version between `from` and `to` (inclusive of `to`, exclusive of `from`). Patch versions can be collapsed — breaking changes in semver-respecting libraries land on majors (and occasionally minors for pre-1.0 packages).

For pre-1.0 packages (`0.x.y`), treat every minor bump as potentially breaking.

### 2. Research breaking changes per version

For each intermediate version, find breaking changes from authoritative sources, in this order of preference:

1. **Official changelog / release notes** — `CHANGELOG.md` in the repo, GitHub Releases page, or the project's docs site. Use WebFetch.
2. **Migration guides** — many projects publish dedicated upgrade guides (e.g. React, Next.js).
3. **WebSearch** — fall back to search for "<pkg> <version> breaking changes" only if the above fail.

Record each breaking change with:

- The version it landed in
- A one-line description
- The specific API / symbol / config affected (so step 3 can grep for it)

Skip non-breaking notes (features, perf, deprecations that still work). Deprecations are worth a brief mention if they will hard-break in the target version.

For **github-actions**, use the action's GitHub Releases / README for breaking changes — especially renamed or removed `with:` inputs and `outputs`.

### 3. Check codebase impact

For each breaking change, search the codebase for usage of the affected API:

**npm packages:**

- Use `grep` / Glob for symbol names, import paths, config keys.
- Be precise — `useEffect` matches React's hook, but also any user-defined function with that substring. Prefer word-boundary or import-source-qualified searches.
- For renamed/removed exports, search the import statement (e.g. `from 'react-router-dom'`).
- For config changes, check config files (`*.config.{js,ts,mjs}`, `tsconfig.json`, etc.).

**github-actions:**

- Grep `.github/workflows/` and `.github/actions/` for `uses:` lines referencing the action.
- Check `with:` / `outputs:` / `env:` keys that match removed or renamed inputs.

Mark each breaking change as:

- **Affects** — usage found, list the file:line locations
- **Safe** — no usage found
- **Uncertain** — usage is ambiguous (e.g. dynamic access, re-exports), explain why

### 4. Report

Output a single concise report. The body of the report must be a markdown table — one row per breaking change — so it renders cleanly both in the terminal and on GitHub.

```
## 🤖 Dependency upgrade review

## <pkg>: <from> → <to>

**Verdict:** <BREAKS / SAFE / NEEDS REVIEW>
**Assumptions:** <one line, or — if none>

| Version | Breaking change | Impact | Where in codebase | Migration hint |
| --- | --- | --- | --- | --- |
| vX.Y.Z | <one-line change> | Affects | `path/to/file.ts:42`, `other.ts:88` | <one-line fix if obvious> |
| vX.Y.Z | <one-line change> | Safe | — | — |
| vX.Y.Z | <one-line change> | Uncertain | <ambiguous location> | <what to check manually> |
```

Rules for the table:

- **Impact** column uses exactly one of: `Affects`, `Safe`, `Uncertain`.
- Sort rows by Impact (`Affects` first, then `Uncertain`, then `Safe`), then by version ascending.
- If a cell is N/A, use `—` (em dash) — never leave it blank.
- Wrap file paths in backticks so GitHub renders them as code.
- Keep each cell to one line. If a migration is complex, link to the upstream migration guide rather than inlining steps.

Keep it tight. The report should answer: _does this upgrade break my code, and if so, where?_ Don't pad with general advice or upgrade-process boilerplate.

### 5. Post to GitHub PR

After producing the report, **always** post it as a PR comment. Also echo the report in the action output.

**Resolve the PR** (no user prompts):

1. `gh pr view --json number,url,headRefName,title,state` on the current branch.
2. If that fails, read `$GITHUB_EVENT_PATH` for `pull_request.number` when present.
3. If multiple open PRs share the branch, use the PR whose `headRefName` matches the current branch.
4. If no PR is found, output the report to the action log only — do not fail the job.

**Post the comment** with:

```bash
gh pr comment <number> --body-file <tmpfile>
```

Write the report body to a temp file first (e.g. via `Write` to `/tmp/dep-review-<pkg>.md`) rather than passing the entire body as a `--body` argument — this avoids shell-escaping issues with the markdown table.

If `gh` is unavailable or unauthenticated, output the report to the action log and exit without failing.

**Skip posting only when:**

- The PR is closed or merged — output the report to the action log and note the PR state in the log.

## Guidelines

- **Don't run the upgrade.** This skill reviews; it does not modify `package.json`, `pnpm-lock.yaml`, workflow files, or install packages.
- **Don't trust your training data for version specifics.** Always fetch the changelog — library versions move faster than the knowledge cutoff.
- **Transitive dependencies are out of scope** unless identifiable from the PR diff as the direct change. Focus on the bumped direct dep.
- **If you can't find a changelog**, say so explicitly rather than guessing. An empty breaking-changes list because you couldn't find data is very different from one because there are none — use verdict `NEEDS REVIEW`.

## Failure modes

Handle these without asking a human:

| Situation | Action |
| --- | --- |
| No package/version inferable from diff or PR metadata | Post a short PR comment: could not infer upgrade target; list files inspected. Verdict N/A. |
| Changelog unavailable | Report with `NEEDS REVIEW`; list sources attempted. |
| `gh` or network failure | Log the full report; exit without failing the workflow. |
| Very large version span | Cover all intermediate majors/minors; report may be long — that is acceptable. |

## Anti-patterns the agent must refuse

- Asking the user which PR, package, or version to review.
- Offering to narrow scope or "focus on one major at a time" instead of completing the review.
- Modifying `package.json`, lockfiles, workflow files, or source to "fix" the upgrade.
- Guessing breaking changes without fetching upstream release notes.
