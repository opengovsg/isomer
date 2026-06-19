---
name: security-review
description: Security-focused review of a pull request for Isomer-specific vulnerabilities (IDOR, missing auth, XSS, unvalidated input, missing audit events, secrets) plus general security issues. Posts findings and writes /tmp/security-result.json for CI consumption.
---

# Instructions

Review the pull request for security vulnerabilities. This skill runs alongside `/pr-review` — it focuses exclusively on security, not general code quality. Safe to invoke locally or from CI.

## Inputs

- The PR diff — fetched via `gh pr diff`.
- Optional argument: a PR number. If provided, use it. Otherwise detect via `gh pr view --json number -q .number`.

## Procedure

1. **Resolve the PR number.** If an argument was passed (e.g. `/security-review 123`), use it. Otherwise:
   ```
   gh pr view --json number -q .number
   ```

2. **Get the diff.**
   ```
   gh pr diff <number>
   ```

3. **Check for the following vulnerability categories** in the changed code:

   **Isomer-specific:**
   - **IDOR** — tRPC procedures that fetch or mutate resources without verifying the caller owns the `siteId` or `resourceId`. Check that every resource lookup scopes to the authenticated user's sites.
   - **Missing auth middleware** — new `pages/api/` routes that bypass tRPC context authentication (i.e. not wrapped in a tRPC procedure or missing session check).
   - **Overly broad permissions** — procedures granting `editor`-level access to operations that should require `admin` or `isomer-admin`. Cross-reference `server/modules/permissions/`.
   - **Missing audit events** — publish, delete, permission-change, or role-assignment actions that do not call the audit logger. Check `server/modules/audit/`.
   - **Mockpass integration** — changes to the Mockpass auth flow that could weaken assertion validation or skip signature checks.
   - **S3/CDN signed URLs** — logic that generates or validates signed URLs for private assets without expiry or scope constraints.

   **General:**
   - **XSS** — user-controlled content rendered to the DOM via `dangerouslySetInnerHTML`, `innerHTML`, or template literals without sanitization.
   - **Unvalidated input** — external data (query params, request bodies, URL segments) reaching Prisma queries, `exec`/`spawn`, or file paths without a Zod schema or equivalent validation first.
   - **Secrets / credentials** — hardcoded API keys, tokens, passwords, or `env.XXX ?? "hardcoded-fallback"` patterns that embed credentials as fallback values.
   - **Dependency injection** — new npm packages added that have known CVEs or are suspiciously named (typosquatting). Check the package name carefully.
   - **Prototype pollution / injection** — `Object.assign` or spread from user input, SQL/NoSQL injection via string concatenation.

4. **Post findings** if any are found:
   ```
   gh pr review <number> --comment --body "<findings>"
   ```
   Prefix each finding with `🚨 Security:`. Group by category. Include `file:line` for every finding.
   If there are no findings, do not post.

5. **Write result** to `/tmp/security-result.json`:
   ```json
   {"blocking": <true if any findings, else false>, "findings": <count>}
   ```
   If clean: `{"blocking": false, "findings": 0}`

## Hard rules

- **Never approve, never request changes, never merge.** Comments only.
- **Cite file:line for every finding.** A vague security concern is noise, not signal.
- **Do not flag theoretical or out-of-scope issues.** Only flag what is present in the diff. Do not speculate about what the code _could_ do if called in a specific way unless the call site is also in the diff.
- **Do not duplicate findings from `/pr-review`.** This skill is for security only — not style, not coverage.
- **If the diff is clean, do not post a comment.**

## Failure modes

- Diff has 0 files → write `{"blocking": false, "findings": 0}` and exit silently.
- PR number cannot be resolved → abort with a clear error.
- `gh pr diff` fails → abort with a clear error.
