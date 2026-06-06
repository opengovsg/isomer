---
name: review-dependency-upgrade
description: Use this skill when the user asks to review, evaluate, or assess a dependency upgrade — e.g. "review this upgrade", "is bumping X from a.b.c to x.y.z safe?", "what breaks if I upgrade <pkg>?", "check this package bump". Covers pnpm/npm packages and github-actions. Researches breaking changes for every intermediate version and reports which ones actually impact the user's codebase.
version: 0.1.0
---

# Review Dependency Upgrade

Assess whether upgrading a dependency will break the user's codebase. Walk every intermediate version, list breaking changes, and cross-check each against actual usage.

## Inputs to confirm

Before researching, make sure you know:

1. **Name** — npm package (e.g. `next`) or github-actions action (e.g. `actions/checkout`)
2. **From version** — the version currently in use
3. **To version** — the target version

If any of these are missing, infer from the repo:

- **npm:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- **github-actions:** `uses:` lines in `.github/workflows/` and `.github/actions/` (SHA + version comment, e.g. `# v6.0.2`)

If still unclear, ask the user.

## Procedure

### 1. Enumerate intermediate versions

List every major and minor version between `from` and `to` (inclusive of `to`, exclusive of `from`). Patch versions can be collapsed unless the user asks otherwise — breaking changes in semver-respecting libraries land on majors (and occasionally minors for pre-1.0 packages).

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
## <pkg>: <from> → <to>

**Verdict:** <BREAKS / SAFE / NEEDS REVIEW>

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

Keep it tight. The user wants to know: _does this upgrade break my code, and if so, where?_ Don't pad with general advice or upgrade-process boilerplate.

### 5. Post to GitHub PR (if applicable)

After producing the report, post it as a PR comment when a PR is associated with this review. Also show the report in chat.

**Detect PR context** (in this order):

1. If the user named a PR explicitly (URL or `#123`), use that.
2. Otherwise, run `gh pr view --json number,url,headRefName,title,state` to see if the current branch has an open PR. If `gh` isn't installed or the user isn't authenticated, skip silently.
3. If still ambiguous and you found multiple candidates, ask the user which PR.

**Post the comment** with:

```bash
gh pr comment <number> --body-file <tmpfile>
```

Write the report body to a temp file first (e.g. via `Write` to `/tmp/dep-review-<pkg>.md`) rather than passing the entire body as a `--body` argument — this avoids shell-escaping issues with the markdown table.

After posting, return the comment URL from `gh`'s output to the user.

**Skip posting when:**

- No PR is detected and the user didn't name one — deliver the report in chat only.
- The PR is closed or merged — deliver the report in chat and note the PR state.

## Guidelines

- **Don't run the upgrade.** This skill reviews; it does not modify `package.json`, `pnpm-lock.yaml`, workflow files, or install packages.
- **Don't trust your training data for version specifics.** Always fetch the changelog — library versions move faster than the knowledge cutoff.
- **Transitive dependencies are out of scope** unless the user names one. Focus on the direct dep.
- **If the version range spans many majors** (e.g. React 16 → 19), warn the user the report will be long and offer to focus on one major at a time.
- **If you can't find a changelog**, say so explicitly rather than guessing. An empty breaking-changes list because you couldn't find data is very different from one because there are none.
