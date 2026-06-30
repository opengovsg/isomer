---
name: isobot-verify
description: Translate a PR's free-text "Manual Verification Steps" checklist into a convention-following Playwright e2e test, commit it to the PR branch, and write the result to /tmp/verify-result.json. Invoked from CI as /isobot-verify <pr-number>. Generates once; a human reviews the committed test.
---

# Instructions

Translate a PR's "Manual Verification Steps" checklist into a permanent, convention-following Playwright e2e test, commit it to the PR branch, and let a human review it. This skill is invoked from CI via `claude-code-action` as `/isobot-verify <pr-number>`, inside a checkout of the PR branch. Two distinct credentials are in play: `gh` commands (the PR comment) authenticate via `GITHUB_TOKEN` in the env, while `git push` uses the credential `actions/checkout` persisted into git config — a PAT / GitHub App token (`secrets.ISOBOT_PAT`) supplied by the `isobot-verify.yml` workflow, **not** `GITHUB_TOKEN`. The full rationale lives in `docs/adr/0003-ai-generated-verification-tests.md` — **read it at run time; it is the source of truth.**

Generate **once**. The test is committed to the PR branch and reviewed by a human like any other code; it then becomes permanent regression coverage. The reviewer is the only safety net against a false-green test, so the generated test must contain **real assertions** and follow the suite conventions or it is worthless.

## Inputs

- `docs/adr/0003-ai-generated-verification-tests.md` — the design and behaviour contract. **Read at run time.**
- `apps/studio/tests/e2e/README.md` — the hard suite conventions (per-role `storageState`, page objects, `getSeedSiteId()` seeding, idempotency under a SHARED DB, the welcome-modal footgun, "do NOT couple to Chakra classes", "one happy-path + one permission-gate test per surface"). **Read at run time.**
- `apps/studio/tests/e2e/fixtures/` (`auth.ts`, `seed.ts`, `site.po.ts`, `login.ts`) — the reusable fixtures the generated test must import rather than reinvent. **Read at run time.**
- One or two exemplar specs — e.g. `apps/studio/tests/e2e/site/settings-agency.test.ts`. **Read at run time.**
- `CONTEXT.md` (repo root) — the domain glossary. Use canonical terms (e.g. "Collection Index", "Tag Category") when naming and structuring the test. **Read at run time.**
- The PR body — fetched via `gh pr view`.
- The PR diff file list — fetched via `gh pr diff --name-only`.
- Optional argument: a PR number. If provided, use it directly. Otherwise detect via `gh pr view --json number -q .number`.

## Procedure

1. **Resolve the PR number.** If an argument was passed (e.g. `/isobot-verify 123`), use it. Otherwise run:

   ```
   gh pr view --json number -q .number
   ```

   If both fail, abort with an error message (see Failure modes).

2. **Idempotency guard (diff-based).** Get the list of files the PR touches:

   ```
   gh pr diff <number> --name-only
   ```

   If any path matches `apps/studio/tests/e2e/**/*.test.ts`, the PR already adds or edits an e2e test. **Do not generate.** This makes the bot's own first commit a no-op on later runs, and lets a human-authored test suppress generation entirely — it protects human edits from being clobbered on re-trigger. Write the result and exit 0:

   ```json
   {"generated": false, "path": null, "reason": "e2e test already present in PR diff"}
   ```

   (If `gh pr diff` is unavailable, fall back to `git diff --name-only origin/<base>...HEAD`, where `<base>` is from `gh pr view <number> --json baseRefName -q .baseRefName`.)

3. **Extract the checklist.** Read the PR body:

   ```
   gh pr view <number> --json body -q .body
   ```

   Pull the lines under the `**Manual Verification Steps**:` heading (up to the next heading, i.e. `**New scripts**:`). Drop every line that is still a template placeholder — an item whose text is exactly `Step 1`, `Step 2`, or `Step 3`. A half-edited template (author rewrote `Step 1` but left `Step 2`/`Step 3`) therefore keeps only the rewritten step. If **zero real (non-placeholder) steps remain**, **do nothing** — write the result and exit 0:

   ```json
   {"generated": false, "path": null, "reason": "no manual verification steps"}
   ```

   Only the real (non-placeholder) steps feed generation in step 5.

4. **Ground in conventions.** Read, at run time: `apps/studio/tests/e2e/README.md`, the fixtures in `apps/studio/tests/e2e/fixtures/`, one or two exemplar specs (`site/settings-agency.test.ts` is canonical), and `CONTEXT.md`. Do not rely on cached assumptions about the suite — the conventions change.

5. **Generate the test.** Write a feature-named `*.test.ts` into the correct module subdirectory under `apps/studio/tests/e2e/`, mirroring the existing `site/`, `page/`, `resource/`, `user/` layout (one directory per backend router module; one file per UI surface). The test MUST:
   - Import and reuse the fixtures — `storageStateFor`/`TEST_EMAILS` from `fixtures/auth`, `getSeedSiteId` from `fixtures/seed`, page objects like `SitePO` from `fixtures/site.po` — rather than reinventing them.
   - Be **idempotent against the shared DB**: reset any state it mutates in `beforeEach` (the DB is shared across the whole suite). Use `db` from `~/server/modules/database` for setup, as the exemplar does.
   - Use the **role-appropriate `storageState`** via `test.use({ storageState: storageStateFor("<role>") })`.
   - Assert **real, user-visible behaviour + persistence** — drive the UI, assert the success toast, then reload and hard-assert the value stuck (see the exemplar's `page.reload()` + `toHaveValue` pattern). Per the README, write one happy-path test per surface and one permission-gate test for the most restrictive role boundary that has UI signal.
   - **Avoid Chakra-class selectors.** Prefer `getByRole` / `getByLabel` over `.chakra-*` locators.
   - **Handle the welcome-modal footgun** where relevant: another suite blanks user `name`/`phone` in the shared DB, so re-populate the acting user's profile in `beforeEach` (see the exemplar) so the onboarding dialog does not obstruct the form.
   - Use **canonical domain terms** from `CONTEXT.md` in the test name, describe blocks, and file name.
   - Include a header comment stating the file was generated by `/isobot-verify` from the PR's Manual Verification Steps and must be human-reviewed.

   If a checklist step cannot be mapped to a real selector or assertion, do **not** emit a fake passing test — skip generation (see Failure modes).

6. **Commit & push to the PR branch.**

   ```
   git add <test-file-path>
   git commit -m "test(e2e): add verification test for PR #<number> [isobot-verify]" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
   git push
   ```

   The trailer line is required per repo convention. Keep the push a **bare `git push`** so it uses the checkout-persisted PAT — do **not** rewrite the remote to `https://x-access-token:$GITHUB_TOKEN@github.com/...`. A push made with `GITHUB_TOKEN` does not fire downstream workflows, which would break the CI re-trigger this commit relies on.

7. **Post a brief PR comment** noting that a verification test was generated and needs review. First resolve the repo URL for the footer:

   ```
   gh repo view --json url -q .url
   ```

   Then post (substituting that value for `<repo_url>`):

   ```
   gh pr comment <number> --body "<comment>"
   ```

   Format:

   ```markdown
   ## 🤖 Verification test generated

   Translated this PR's **Manual Verification Steps** into an e2e test at `<test-file-path>`. It now runs in the `end-to-end-tests` job. **Please review the assertions** — a generated test is only trustworthy once a human confirms it asserts the right behaviour.

   <sub>Posted by [🤖 IsoBot: Verify](<repo_url>/blob/main/.github/workflows/isobot-verify.yml)</sub>
   ```

8. **Write the result** to `/tmp/verify-result.json`:

   ```json
   {"generated": <bool>, "path": "<test path or null>", "reason": "<one sentence>"}
   ```

9. **Print a summary** to stdout:

   ```
   Generated: <true|false>
   Path: <test path or null>
   Reason: <reason>
   ```

## Hard rules

- **Real assertions only.** Never emit a no-op assertion (`expect(x).toBeTruthy()`, `expect(page).toBeDefined()`, etc.). The reviewer is the only safety net against false-greens; a test that asserts nothing defeats the entire point.
- **Never overwrite an existing e2e test.** The diff-based idempotency guard in step 2 exists precisely to protect human edits — if it trips, do not generate.
- **Follow the README conventions** — per-role `storageState`, fixture reuse, shared-DB idempotency, no Chakra-class selectors, persistence asserted by reload.
- **Read the conventions at run time.** Do not rely on cached assumptions about fixtures, exemplars, or domain terms — the suite and glossary change.
- **No-op gracefully** on an empty/placeholder checklist or a pre-existing e2e test in the diff — write the result file and exit 0 without committing or commenting.

## Failure modes

- PR number cannot be resolved → abort with a clear error.
- PR body fetch fails → abort with a clear error.
- Push fails → still write `/tmp/verify-result.json` so CI can read the outcome; report the push failure in the result `reason`. (Fork PRs are excluded upstream by the `isobot-verify.yml` author gate, which restricts the workflow to OWNER/MEMBER, so the skill assumes a pushable same-repo branch.)
- A checklist step cannot be mapped to a real selector or assertion → write `{"generated": false, "path": null, "reason": "<which step could not be mapped>"}` and skip, rather than emit a fake passing test.
