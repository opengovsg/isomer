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

| Test category | Site strategy |
|---------------|---------------|
| **Read-only / seed-dependent** | Seed site ID `1` ("Sample Site") — e.g. `site/list.test.ts`, `godmode/access.test.ts` |
| **Mutating** | Dedicated site per test file via `provisionE2ESite` in `beforeAll`, `teardownE2ESite` in `afterAll` |

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
- `getSeedSiteId()` is **deprecated for mutating tests**; keep for read-only seed tests only
- Use `resetSite*` helpers from `fixtures/reset.ts` in `beforeEach` for idempotent state
- `provisionE2ESite` creates a root page + search page so the site dashboard loads

## How to detect violations

- Mutating test using `getSeedSiteId()` → should use `provisionE2ESite`
- Duplicated wizard/invite flows in test files → move to `helpers.ts` or a PO
- Test file writing to site ID `1` outside read-only suites
