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
| **Helpers** | `fixtures/helpers.ts` | Flows that **cross surfaces** (e.g. create page: dashboard wizard → page editor) |
| **Page objects** | `fixtures/*.po.ts` | Locators + actions on **one** UI surface, including multi-step modals/forms on that surface (`fillPageWizard`, `fillInviteForm`, …) |
| **DB setup** | `fixtures/reset.ts`, `fixtures/site.ts` | Non-UI reset and site lifecycle |
| **DB assertions** | `fixtures/*.db.ts` | Query helpers that fetch persisted state for a test to assert on (`resource.db.ts`, `user.db.ts`, …) |

**Wizards** here means multi-step modals on a single surface (e.g. Create Page:
"Next: Page title and URL" → fill title → "Start editing"). The step sequence
lives on the surface's PO (`DashboardPO.fillPageWizard`); a helper in
`helpers.ts` only wires PO calls together and handles navigation **between**
surfaces (e.g. `createPageViaWizard` waits for the page-editor URL after the
dashboard wizard completes).

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
- **Exception:** files that exercise surfaces not scoped to a site (e.g. `godmode/`,
  `smoke.test.ts`) do not need `provisionE2ESite`

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

**Cross-role sessions:** when a test needs a *second* role in the same
scenario (e.g. editor saves, publisher publishes), use `withSeededPageEditorAsRole`
or `withRoleSession` from `helpers.ts` — they spin up a fresh
`browser.newContext({ storageState: storageStateFor(role) })` and close it in
`finally`. That is not the same as `test.use({ storageState })` (which would
replace the whole project's session). Prefer the `with*` helpers over
`openSeededPageEditorAsRole` + manual `context.close()` (see
`publish-page.test.ts`). Use `withRoleSession` when the second role navigates
somewhere other than the page editor.

```ts
// Page editor handoff (editor saves → publisher publishes)
await withSeededPageEditorAsRole(browser, "publisher", siteId, pageId, async ({ editor }) => {
  await editor.clickPublish()
  await editor.expectPublishedToast()
})

// Any other surface under a second role's session
await withRoleSession(browser, "admin", async ({ page }) => {
  await page.goto(`/sites/${siteId}/users`)
  // …
})
```

## Page objects (PR-4)

Page objects live in `fixtures/*.po.ts` and wrap locators + actions for **one** UI
surface. Prefer them over raw Playwright calls when a locator will be reused.

| PO | File | Surface |
|----|------|---------|
| `SitePO` | `site.po.ts` | Site settings |
| `DashboardPO` | `dashboard.po.ts` | Site dashboard / resource table |
| `PageEditorPO` | `page-editor.po.ts` | Page edit + publish chrome |
| `PageSettingsPO` | `page-settings.po.ts` | Page settings modal (from dashboard) |
| `CollectionPO` | `collection.po.ts` | Collection link/page editor drawers |
| `FolderSettingsPO` | `folder-settings.po.ts` | Folder settings modal |
| `UsersPO` | `users.po.ts` | Users / collaborators page |

Rules:

- Constructor takes `Page`; methods are async actions or locator getters
- Put modal/form **step sequences** on the PO for that surface
  (`DashboardPO.fillPageWizard`, `UsersPO.fillInviteForm`) — not raw
  `page.getByRole` calls in `helpers.ts`
- Put **cross-surface orchestration** in `helpers.ts` — helpers call POs and
  handle navigation between surfaces (e.g. `createPageViaWizard`,
  `inviteCollaborator`)
- Do not put DB setup in POs — use `provisionE2ESite` / integration seed helpers

```ts
// helpers.ts — cross-surface flow
export const createPageViaWizard = async (page, { startUrl, title, siteId }) => {
  await page.goto(startUrl)
  const dashboard = new DashboardPO(page)
  await dashboard.openCreateMenu()
  await dashboard.clickCreatePage()
  await dashboard.fillPageWizard(title) // PO owns the modal steps
  await page.waitForURL(new RegExp(`/sites/${siteId}/pages/\\d+$`))
}

// dashboard.po.ts — steps on the dashboard surface only
async fillPageWizard(title: string) {
  await this.page.getByRole("button", { name: "Next: Page title and URL" }).click()
  await this.page.getByLabel("Page title").fill(title)
  await this.page.getByRole("button", { name: "Start editing" }).click()
}
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

## DB assertions (`fixtures/page-seed.ts`)

After UI mutations (delete, move, rename, publish), assert persisted state via
`expect.poll` helpers in `page-seed.ts` — not inline `db.selectFrom(...)` in test
files. Examples:

- `expectResourceAbsent` / `expectResourcePresent` — row existence
- `expectResourceParentId` — move outcomes
- `expectResourceTitle` — title changes (pages, folders, collections)

Use Playwright's default poll timeout unless a specific surface needs more.

## How to detect violations

- Asserting "Sample Site", hardcoding a site ID, or calling `teardownE2ESite`/`getSeedSiteId()` (neither exists anymore) → use `provisionE2ESite` and assert on the returned site
- Duplicated cross-surface flows in test files → move to `helpers.ts`; duplicated modal/form steps → add a PO method
- `test.use({ storageState: storageStateFor(...) })` in a test file → use `{ tag: roleTag(...) }` on `test.describe` instead
- Raw `{ tag: "@admin" }` → use `roleTag("admin")` so unknown roles fail typecheck
- Raw `page.getByRole("button", { name: "Create new..." })` repeated across files → use `DashboardPO`
- Inline `db.selectFrom(...)` (or Prisma query) in a test file feeding an `expect()` → extract the query into `fixtures/<entity>.db.ts`
- Inline `db.selectFrom("Resource")` in `*.test.ts` → use `page-seed.ts` poll helpers
- Raw `page.waitForURL(...)` for dashboard navigation → use `DashboardPO.expectOnFolder` / `expectOnCollection` / `expectOnPageEditor`
