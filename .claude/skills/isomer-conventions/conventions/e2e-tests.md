---
title: E2E test conventions (Studio Playwright suite)
category: Testing
type: best-practice
---

Living reference for `apps/studio/tests/e2e/`. Update this file only when the stack
introduces a **new reusable pattern** — not when merely adding test cases. See
`docs/superpowers/plans/2026-07-24-e2e-scale-and-coverage-spec.md`.

## File layout

- `tests/e2e/<module>/<surface>.test.ts` — one file per UI surface
- `fixtures/` — shared infrastructure (auth, seed, helpers, page objects)
- Import `test` / `expect` from `@playwright/test` directly (no `fixtures/test.ts` re-export)

## Helpers vs page objects

| Layer | File | Use for |
|-------|------|---------|
| **Helpers** | `fixtures/helpers.ts` | Multi-step flows crossing pages or modals (wizard, invite) |
| **Page objects** | `fixtures/*.po.ts` | Locators + actions on one UI surface (`SitePO`, `DashboardPO`, …) |
| **DB setup** | `fixtures/reset.ts`, `fixtures/site.ts` | Non-UI reset and site lifecycle |

## Welcome modal

Call `ensureUserOnboarded(TEST_EMAILS.<role>)` in `beforeEach` so the welcome modal
does not block tests (singpass global-setup can blank profiles).

## Test pattern

Per UI surface: **one happy-path** + **one permission-gate** where the UI shows a
signal (hidden button, redirect, disabled control). Do not translate audit-log or
validation-edge-case scenarios — those stay in integration tests.

## Per-site isolation (PR-2)

Every test file gets a dedicated site via `provisionE2ESite` in `beforeAll` —
including read-only tests. There is no per-test/per-site teardown: the whole
e2e database is wiped and re-seeded once at the start of each run
(`resetE2EDatabase()` in `global-setup.ts`), so sites created during a run
simply accumulate until the next run resets everything. Never assert on seed
site names or hardcode a site ID — `seedRolesForE2E()` self-provisions its own
site via `setupSite()` for the shared `TEST_EMAILS` users' permissions; there
is no fixed "Sample Site"/site ID `1` for e2e to depend on.

```ts
let siteId: number
let siteName: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
  siteName = site.siteName
})
```

- Grant roles with `provisionE2ESite({ roles: [...] })` — maps to `TEST_EMAILS`
- Assert on the returned `siteName` / `siteId`, not Prisma seed fixtures
- Use `resetSite*` helpers from `fixtures/reset.ts` in `beforeEach` for idempotent state
- `provisionE2ESite` creates a root page + search page so the site dashboard loads
- Do not add a `teardownE2ESite`/per-test cleanup call — it doesn't exist; cleanup is run-scoped, not test-scoped

## How to detect violations

- Asserting "Sample Site", hardcoding a site ID, or calling `teardownE2ESite`/`getSeedSiteId()` (neither exists anymore) → use `provisionE2ESite` and assert on the returned site
- Duplicated wizard/invite flows in test files → move to `helpers.ts` or a PO
