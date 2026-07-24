# E2E Tests

## Fixtures

| Module                | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `fixtures/user.ts`    | `ensureUserOnboarded(email)` — skip welcome modal              |
| `fixtures/reset.ts`   | Site-scoped DB reset helpers (`resetSiteAgencySettings`, etc.) |
| `fixtures/helpers.ts` | Shared UI flows (create page/folder, invite user)              |
| `fixtures/auth.ts`    | Role storage-state paths and `TEST_EMAILS`                     |
| `fixtures/seed.ts`    | Idempotent E2E role seeding                                    |
| `fixtures/site.po.ts` | Site settings page object                                      |

## Structure

- `fixtures/` — reusable test infrastructure (login flow, page objects, role storage state).
- `storage-state/` — gitignored; populated by `global-setup.ts` with one signed-in cookie jar per role.
- `<module>/` — one directory per backend router module (`site/`, `page/`, `resource/`, …). Each file inside covers a single UI surface (e.g. `site/settings-agency.test.ts`).

## Adding tests for a new module

1. Identify the router's `__tests__/<module>.router.test.ts` file.
2. For each `describe` block, identify the user-facing UI surface (settings page, dashboard view, modal, …).
3. Write **one happy-path test per surface** (drive the UI, assert toast + persisted state).
4. Write **one permission-gate test per surface** for the most restrictive role boundary that has UI signal.
5. Do **not** translate validation-error or audit-log scenarios — those stay in integration tests.

## Role projects and `@role` tags

Auth is wired through Playwright **projects**, not per-file `test.use({ storageState })`.

| Project                                                        | How tests are selected            | Auth                         |
| -------------------------------------------------------------- | --------------------------------- | ---------------------------- |
| `unauthenticated`                                              | `testMatch: /smoke\.test\.ts/`    | none                         |
| `singpass`                                                     | `testMatch: /singpass\.test\.ts/` | none (suite skipped)         |
| `admin`, `editor`, `publisher`, `nomember`, `core`, `migrator` | `grep: /@role\b/`                 | `storageState` for that role |

**New tests must use `roleTag(...)` on `test.describe`**, not `test.use({ storageState })`:

```ts
import { roleTag } from "../fixtures/auth"

test.describe("admin", { tag: roleTag("admin") }, () => {
  test("...", async ({ page }) => {
    /* project supplies admin cookies */
  })
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test("...", async ({ page }) => {
    /* ... */
  })
})
```

`roleTag` is typed against `ROLES` in `fixtures/auth.ts`, so an unknown role fails at compile time.

Run a single role: `pnpm exec playwright test --project=admin`.

## Why storage-state, not per-test login

OTP + Mockpass adds ~4s per login. Without storage state, a 10-test suite spends 40s on auth alone. Global-setup signs in each role once at startup (in parallel); role projects reuse cookies via project `storageState`.

## Why we still keep integration tests

E2E covers user-visible behavior. Integration tests cover server-side correctness: audit log shape, GTM ID validation, role-boundary 401/403/404 codes, SearchSG side effects. We need both layers. Translating every integration scenario to e2e would triple CI time without adding meaningful signal.

## Known footguns

- **`singpass.test.ts`'s `beforeEach` blanks every user's `name`/`phone`/`singpassUuid`** in the shared test DB. Because tests share a database, a suite that runs after it sees blanked profiles. Tests that need a non-empty profile (to skip the welcome modal) must re-populate it in their own `beforeEach`. See `site/settings-agency.test.ts` for the pattern.
- **`storage-state/` is gitignored but persists across local runs**. If you switch your local DB target away from the test DB, delete the cookie jars before running again: `rm apps/studio/tests/e2e/storage-state/*.json` (the `.gitignore` is preserved).

## Open follow-ups

- **Admin dashboard bypass in `settings-agency.test.ts`.** The admin test navigates directly to `/sites/1/settings/agency` instead of clicking through the dashboard site list. Reason: the admin storage state was hitting an empty/unmatched site list at the time of writing. The editor test in `site/list.test.ts` does click through successfully, so this is admin-specific. Worth investigating whether admin sees a different dashboard render or whether it's a session/timing race.
- **`.chakra-switch` selector in `settings-notification.test.ts`.** Couples the test to Chakra UI's class naming. Right fix is upstream: add an `aria-label` to the Switch in the FormBuilder render path for optional object groups, then update the locator to `getByRole("switch", { name: ... })`.
