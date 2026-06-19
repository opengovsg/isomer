---
name: ci-autofix
description: Fix failing CI jobs (lint, format, typecheck, build) on a pull request by running the relevant commands, correcting errors, committing the fix, and pushing. Capped at 3 attempts. Never fixes test failures and never adds lint suppressions.
---

# Instructions

Fix CI failures on a pull request. This skill is invoked by the automated `pr-autofix` workflow when CI fails, but can also be run locally.

## Inputs

- Optional argument: a PR number. If provided, use it. Otherwise detect via `gh pr view --json number -q .number`.
- The current checked-out branch (must be the PR's head branch — the skill commits and pushes).

## Scope

Only fix failures from these CI jobs: **lint**, **format**, **typecheck**, **build**.

Do NOT fix:
- Unit test failures (`pnpm test:unit`)
- E2E test failures (`pnpm test:e2e`)
- Publishing script test failures

If the only failures are tests, post a PR comment explaining what failed and stop without committing anything.

## Hard constraints — these override everything else

- **Never add lint suppression comments**: `// oxlint-disable`, `// eslint-disable`, `// @ts-ignore`, `// @ts-expect-error` (unless the type error is genuinely unreachable and `@ts-expect-error` is the correct tool — use extreme caution).
- **Never modify lint configuration files** (`oxlint.json`, `.eslintrc`, `tsconfig.json` `strict` settings) to silence errors.
- **Never delete or weaken an existing test** to make typecheck pass.
- **Never change logic to avoid a type error** — only add narrowing, type guards, or correct types.
- If a fix is impossible without violating a constraint, post a PR comment explaining the specific blocker and stop. Do not commit a partial fix.

## Procedure

1. **Resolve the PR number.** If an argument was passed (e.g. `/ci-autofix 123`), use it. Otherwise:
   ```
   gh pr view --json number -q .number
   ```

2. **Reproduce the failures.** Run each fixable check to see the current errors:
   ```
   pnpm lint
   pnpm format
   pnpm typecheck
   pnpm build
   ```

3. **Fix each failing check.**
   - **lint**: Run `pnpm lint:fix` first for auto-fixable rules. Fix remaining errors manually — read the rule description before deciding on a fix.
   - **format**: Run `pnpm format:fix`.
   - **typecheck**: Fix type errors in the affected files. Add narrowing, correct types, or fix the code — do not suppress.
   - **build**: Fix import errors, missing exports, or compilation issues.

4. **Verify.** Re-run the commands that were failing to confirm they now pass.

5. **Commit and push.**
   ```
   git add <changed files>
   git commit -m "chore: autofix CI [bot]"
   git push
   ```
   Only stage files that were needed for the fix. Do not stage unrelated changes.

6. **If a fix is impossible**, post a PR comment:
   ```
   gh pr comment <number> --body "CI autofix could not fix: <specific error>. Reason: <why suppression/modification would be needed>. Manual fix required."
   ```
   Then stop without committing.

## Failure modes

- No fixable failures found → exit silently. Do not commit anything.
- PR number cannot be resolved → abort with a clear error.
- Push fails (e.g. branch protection) → post a PR comment with the push error and stop.
