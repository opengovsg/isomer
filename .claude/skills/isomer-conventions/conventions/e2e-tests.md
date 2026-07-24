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

Every test file gets a dedicated site via `provisionE2ESite` in `beforeAll`,
torn down via `teardownE2ESite` in `afterAll` — including read-only tests.
There is no shared seed-site accessor (`getSeedSiteId()` was removed); the only
tests that still reference seed site ID `1` directly are ones asserting on the
pre-seeded fixture data itself (e.g. `site/list.test.ts` checking the
dashboard shows the pre-seeded "Sample Site"), not using it as a general-purpose
test site.

```ts
let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ admin: true })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})
```

- Grant roles with `provisionE2ESite({ admin, editor, publisher })` — maps to `TEST_EMAILS`
- Use `resetSite*` helpers from `fixtures/reset.ts` in `beforeEach` for idempotent state
- `provisionE2ESite` creates a root page + search page so the site dashboard loads

## How to detect violations

- Test using `getSeedSiteId()` or hardcoding site ID `1` → should use `provisionE2ESite`, unless it's specifically asserting on pre-seeded fixture data
- Duplicated wizard/invite flows in test files → move to `helpers.ts` or a PO
