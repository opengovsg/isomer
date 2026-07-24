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
| **DB assertions** | `fixtures/*.db.ts` | Query helpers that fetch persisted state for a test to assert on (`resource.db.ts`, `user.db.ts`, …) |

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
Playwright `global-setup` seeds auth bootstrap only (`@open.gov.sg` whitelist +
canonical test users). Per-test sites come from `provisionE2ESite` — never assert
on Prisma dev seed data or hardcode site ID `1`.

```ts
let siteId: number
let siteName: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
  siteName = site.siteName
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})
```

- Grant roles with `provisionE2ESite({ roles: [...] })` — maps to `TEST_EMAILS`
- Assert on the returned `siteName` / `siteId`, not Prisma seed fixtures
- Use `resetSite*` helpers from `fixtures/reset.ts` in `beforeEach` for idempotent state
- `provisionE2ESite` creates a root page + search page so the site dashboard loads

## Role projects and tags (PR-3)

Playwright config defines one project per role plus `unauthenticated` (smoke) and `singpass`. Role projects set `storageState` and filter with `grep: /@role\b/`.

```ts
import { roleTag } from "../fixtures/auth"

test.describe("admin", { tag: roleTag("admin") }, () => {
  test("...", async ({ page }) => {
    /* cookies come from the admin project — do not call test.use({ storageState }) */
  })
})
```

Use `roleTag(...)` (typed from `ROLES`) — not a raw `"@admin"` string. Multi-role files should map over `ROLES` with an exhaustive `Record<Role, …>` when every role must be classified (see `site/admin.test.ts`).

| Do | Don't |
|----|-------|
| `{ tag: roleTag("admin") }` on each role `describe` | `test.use({ storageState: storageStateFor(...) })` |
| Put smoke in `smoke.test.ts` (no role tag) | Mix unauthenticated smoke into role-tagged files |
| Run `pnpm exec playwright test --project=admin` to filter | Rely on file path alone for role selection |

## Page objects (PR-4)

Page objects live in `fixtures/*.po.ts` and wrap locators + actions for **one** UI
surface. Prefer them over raw Playwright calls when a locator will be reused.

| PO | File | Surface |
|----|------|---------|
| `SitePO` | `site.po.ts` | Site settings |
| `DashboardPO` | `dashboard.po.ts` | Site dashboard / resource table |
| `PageEditorPO` | `page-editor.po.ts` | Page edit + publish chrome |
| `UsersPO` | `users.po.ts` | Users / collaborators page |

Rules:

- Constructor takes `Page`; methods are async actions or locator getters
- Keep multi-step flows that cross surfaces (create wizard, invite) in
  `helpers.ts` — helpers may call POs for the surface-specific steps
- Do not put DB setup in POs — use `provisionE2ESite` / integration seed helpers

```ts
const dashboard = new DashboardPO(page)
await dashboard.gotoSite(siteId)
await dashboard.openCreateMenu()
await dashboard.clickCreateFolder()
```

## DB assertion helpers (PR-5)

When a test needs to verify persisted state (e.g. "the created page has state
Draft"), the raw query lives in `fixtures/<entity>.db.ts` — one file per DB
entity, mirroring `*.po.ts` per UI surface. The test file imports the query
helper and keeps the `expect(...)` calls itself (Assert stays in the test; the
fixture only fetches data).

```ts
// fixtures/resource.db.ts
export const getResourceByTitle = (opts: { siteId: number; title: string }) =>
  db
    .selectFrom("Resource")
    .where("siteId", "=", opts.siteId)
    .where("title", "=", opts.title)
    .select(["id", "state", "type", "parentId"])
    .executeTakeFirst()

// tests/e2e/page/create-page.test.ts
const created = await getResourceByTitle({ siteId, title })
expect(created?.state).toBe("Draft")
```

Rules:

- Query helpers return raw rows/values — no `expect()` inside `fixtures/*.db.ts`
- One file per entity (`resource.db.ts`, `user.db.ts`), not per test
- Setup/teardown mutations (inserts/deletes for fixtures, not assertions) stay
  under the existing DB setup convention (`reset.ts`, `site.ts`) — this only
  covers read queries used to verify an action's effect

## How to detect violations

- Asserting "Sample Site", hardcoding site ID `1`, or calling `getSeedSiteId()` → use `provisionE2ESite` and assert on the returned site
- Duplicated wizard/invite flows in test files → move to `helpers.ts` or a PO
- `test.use({ storageState: storageStateFor(...) })` in a test file → use `{ tag: roleTag(...) }` on `test.describe` instead
- Raw `{ tag: "@admin" }` → use `roleTag("admin")` so unknown roles fail typecheck
- Raw `page.getByRole("button", { name: "Create new..." })` repeated across files → use `DashboardPO`
- Inline `db.selectFrom(...)` (or Prisma query) in a test file feeding an `expect()` → extract the query into `fixtures/<entity>.db.ts`
