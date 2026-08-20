---
title: E2E test conventions (Studio Playwright suite)
category: Testing
type: best-practice
---

Living reference for `apps/studio/tests/e2e/`. Update when the stack introduces a
**new reusable pattern** — not when merely adding test cases.

Fixture import paths and onboarding: `apps/studio/tests/e2e/README.md`.

## File layout

- `tests/e2e/<module>/<surface>.test.ts` — one file per UI surface
- `fixtures/` — shared infrastructure; import via `~e2e/fixtures/<subpath>` (no root barrel)
- Import `test` / `expect` from `@playwright/test` directly
- A topic folder (e.g. `dashboard/`) is also allowed when a set of tests spans multiple
  resource types around one user-facing area (nav, search, sidebar) rather than fitting
  one resource-type module — don't force those into an existing `<resource-type>/` folder.

## Fixture layers

| Layer             | Import from                                     | Use for                                                   |
| ----------------- | ----------------------------------------------- | --------------------------------------------------------- |
| **Helpers**       | `~e2e/fixtures/helpers`                         | Multi-step flows crossing pages or modals                 |
| **Page objects**  | `~e2e/fixtures/po`                              | Locators + actions on one UI surface                      |
| **DB fixtures**   | `~e2e/fixtures/<entity>`, `~e2e/fixtures/reset` | Arrange, read queries, poll assertions, site-scoped reset |
| **Network mocks** | `~e2e/fixtures/network`                         | Route stubs (S3 upload, GrowthBook) in `beforeEach`       |

Entity folders (e.g. `resource/`, `site/`, `user/`, `whitelist/`, `role/`) typically use:

| File        | Purpose                         |
| ----------- | ------------------------------- |
| `seed.ts`   | Arrange inserts/setup           |
| `db.ts`     | Read queries, no `expect()`     |
| `expect.ts` | `expect.poll` assertion helpers |

Not every folder needs all three — only add a file when there's a real use for it. `site/` uses `provision.ts` (`provisionE2ESite`) instead of `seed.ts`, since it provisions a whole site rather than seeding rows into one; `role/` has no `db.ts`/`expect.ts` since role seeding has nothing to read back or poll.

`role/seed.ts` runs global role seeding (`seedRolesForE2E`) from `global-setup.ts`.

## Welcome modal

Call `ensureUserOnboarded(TEST_EMAILS.<role>)` in `beforeEach` so the welcome modal does not block tests.

## Per-site isolation

Every test file gets a dedicated site via `provisionE2ESite` in `beforeAll`. The e2e database is wiped once per run in `global-setup.ts` — no per-test site teardown.

```ts
let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
})
```

- `roles` maps to `TEST_EMAILS`; assert on returned `siteId` / `siteName`, not hardcoded seed site names or IDs
- Use `resetSite*` from `~e2e/fixtures/reset` in `beforeEach` for idempotent settings state
- `provisionE2ESite` creates root + search pages so the dashboard loads

### Serial mode for shared mutable settings

When 2+ tests in the same `describe` mutate the **same** `siteId`'s persisted settings (e.g. fill a form + publish, then assert the saved value), add `test.describe.configure({ mode: "serial" })` right after the `describe` opens. Playwright may otherwise run those tests in different workers/order, racing writes to the same row. Not needed when tests only read, or when a `describe` has a single test — see `site/settings-common.test.ts`, `settings-footer.test.ts`, `settings-logo.test.ts`, `settings-navbar.test.ts`, `settings-notification.test.ts`, `settings-colours.test.ts`, `settings-integrations.test.ts`, `settings-redirects.test.ts`, `admin-save.test.ts` for the pattern.

## Resource cleanup

Track the exact resource(s) a test creates and delete by ID in `afterEach` — do not delete by title prefix scoped to `siteId`. A title-prefix delete removes every matching row for the site, including ones a concurrently-running test (same file, parallel worker) just created and hasn't asserted on yet.

```ts
test.describe("admin", { tag: roleTag("admin") }, () => {
  let createdPageId: string | undefined

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    createdPageId = undefined
  })

  test.afterEach(async () => {
    if (createdPageId) {
      await deleteResourceById(createdPageId)
    }
  })

  test("admin can create a new page via the wizard", async ({ page }) => {
    // ...
    createdPageId = created?.id
  })
})
```

`deleteResourcesByTitlePrefix` / `deleteCollectionsByTitlePrefix` were removed for this reason — don't reintroduce title-prefix cleanup helpers.

## Settings publisher gate

Publisher permission gates for settings Publish buttons live in **one** file: `site/settings-permissions.test.ts`. Add new Publish-gated sections to `PUBLISH_GATED_SETTINGS_SECTIONS` in `fixtures/po/site-settings.ts` — do not repeat permission-gate tests in individual settings happy-path files.

When iterating the same Act/Assert over multiple sections (as `settings-permissions.test.ts` and `settings-common.test.ts` do over `PUBLISH_GATED_SETTINGS_SECTIONS`), register **one `test()` per section** via a `for` loop around `test(...)` — not multiple Acts in one test body.

## Role projects and tags

One `unauthenticated` project (`smoke.test.ts`, `singpass.test.ts`) and one project per role. Role projects set `storageState` and filter with `grep: /@role\b/`.

| Do                                                                       | Don't                                                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `{ tag: roleTag("admin") }` on each role `describe` — typed from `ROLES` | `test.use({ storageState: storageStateFor(...) })`, or raw `{ tag: "@admin" }` strings |
| Smoke in `smoke.test.ts` (no role tag)                                   | Unauthenticated smoke in role-tagged files                                             |

## Page objects

POs live in `fixtures/po/` (`import from "~e2e/fixtures/po"`). One PO per UI surface; multi-surface flows stay in `helpers.ts`.

| PO                 | File (`fixtures/po/`) | Surface                    |
| ------------------ | --------------------- | -------------------------- |
| `SitePO`           | `site-settings.ts`    | Site settings              |
| `DashboardPO`      | `dashboard.ts`        | Site dashboard / resources |
| `PageEditorPO`     | `page-editor.ts`      | Page edit + publish        |
| `PageSettingsPO`   | `page-settings.ts`    | Page settings modal        |
| `FolderSettingsPO` | `folder-settings.ts`  | Folder settings modal      |
| `UsersPO`          | `users.ts`            | Collaborators page         |

Constructor takes `Page`. No DB setup in POs.

### Locators: match by label, not position

Prefer `getByRole(role, { name })` / `getByLabel(...)` matched against the control's visible/aria label over positional locators like `getByRole("checkbox").first()/.last()` or `page.locator("textarea").nth(1)`. Positional locators silently point at the wrong element the moment a sibling control is added, reordered, or conditionally rendered. If the underlying component has no accessible name yet, add `aria-label={label}` to it (see `JsonFormsBoxedGroupControl.tsx`, `godmode/whitelist.tsx`) rather than falling back to position in the PO.

### `page.*` in test files

**Smell:** any `page.<method>(` in `tests/e2e/**/*.test.ts` outside the allowlist.

**Allowlist:**

| Call                                     | Why                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `async ({ page })` fixture destructuring | Playwright test signature                                           |
| `new SomePO(page)`                       | PO construction                                                     |
| Documented infra exceptions in this file | e.g. `resetGrowthBookPage(page)` before GrowthBook-gated navigation |

Everything else (`page.goto`, `getByRole`, `waitForURL`, …) belongs in `fixtures/po/` or `fixtures/helpers.ts`. Add the PO/helper method first, then call it from the test.

```bash
rg 'page\.\w+\(' apps/studio/tests/e2e --glob '*.test.ts'
```

## DB assertions

- **One-shot reads:** query in `fixtures/<entity>/db.ts`, `expect()` in the test
- **Poll after mutations:** `expect.poll` helpers in `fixtures/<entity>/expect.ts` — not inline `db.selectFrom(...)` in tests

Rules:

- `*.db.ts` is read-only — no `expect()` inside
- Setup/teardown mutations go in `seed.ts` or `~e2e/fixtures/reset`

Examples: `expectResourceAbsent`, `expectResourceTitle`, `expectSiteName`, `expectUserRoleOnSite`.

## Violation smells

| Smell                                   | Fix                                                 |
| --------------------------------------- | --------------------------------------------------- |
| Hardcoded site ID or seed site name     | `provisionE2ESite` + assert returned `siteId`       |
| Duplicated wizard/invite flow in a test | `helpers.ts` or PO                                  |
| `test.use({ storageState })`            | `{ tag: roleTag(...) }` on `describe`               |
| Inline `db.selectFrom` in `*.test.ts`   | `fixtures/<entity>/db.ts` or `expect.ts`            |
| `page.waitForURL` for dashboard nav     | `DashboardPO.expectOnFolder` / `expectOnPageEditor` |
| Any other `page.*` in `*.test.ts`       | PO or helper for that surface                       |
| Delete-by-title-prefix in `afterEach`   | Track created ID(s), `deleteResourceById`           |
| `.first()`/`.last()`/`.nth()` on a labeled control | `getByRole(role, { name })` / `getByLabel`, adding `aria-label` if missing |
| 2+ tests in one `describe` mutating the same shared `siteId` settings, no serial mode | `test.describe.configure({ mode: "serial" })` |
