---
title: E2E test conventions (Studio Playwright suite)
category: Testing
type: best-practice
---

Rules and **violation smells** for `apps/studio/tests/e2e/`. Use when writing or
reviewing e2e tests to catch deviations — not as a file catalog.

**Onboarding** (how to run tests, import paths, project layout, PO exports):
`apps/studio/tests/e2e/README.md`.

Update this file when the suite gains a **new enforceable pattern** (a rule or
smell), not when adding test cases or POs.

## File layout

- `tests/e2e/<module>/<surface>.test.ts` — one file per UI surface
- `fixtures/` — shared infrastructure; import via `~e2e/fixtures/<subpath>` (no root barrel)
- Import `test` / `expect` from `@playwright/test` directly

## Fixture layers

Put code in the right layer — wrong layer is a smell.

| Layer             | Import from                                     | Use for                                                   |
| ----------------- | ----------------------------------------------- | --------------------------------------------------------- |
| **Helpers**       | `~e2e/fixtures/helpers`                         | Multi-step flows crossing pages or modals                 |
| **Page objects**  | `~e2e/fixtures/po`                              | Locators + actions on one UI surface                      |
| **DB fixtures**   | `~e2e/fixtures/<entity>`, `~e2e/fixtures/reset` | Arrange, read queries, poll assertions, site-scoped reset |
| **Network mocks** | `~e2e/fixtures/network`                         | Route stubs (S3 upload, GrowthBook) in `beforeEach`       |

Entity folders (`resource/`, `site/`, `user/`, `whitelist/`, `role/`, `collection/`, …):

| File        | Purpose                         |
| ----------- | ------------------------------- |
| `seed.ts`   | Arrange inserts/setup           |
| `db.ts`     | Read queries, no `expect()`     |
| `expect.ts` | `expect.poll` assertion helpers |

Exceptions (do not “complete the trio” blindly): `site/` uses `provision.ts` instead of `seed.ts`; `role/` has only `seed.ts` for global role seeding in `global-setup.ts`.

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

## Settings publisher gate

Publisher permission gates for settings Publish buttons live in **one** file: `site/settings-permissions.test.ts`. Add new Publish-gated sections to `PUBLISH_GATED_SETTINGS_SECTIONS` in `fixtures/po/site-settings.ts` — do not repeat permission-gate tests in individual settings happy-path files.

When iterating the same Act/Assert over multiple sections (as `settings-permissions.test.ts` and `settings-common.test.ts` do over `PUBLISH_GATED_SETTINGS_SECTIONS`), register **one `test()` per section** via a `for` loop around `test(...)` — not multiple Acts in one test body.

## Role projects and tags

`unauthenticated` matches `smoke.test.ts` and skipped `singpass.test.ts`. `login-flow` matches `login-flow.test.ts` (the only UI sign-in spec). One project per role sets `storageState` and filters with `grep: /@role:<role>\b/` (for example `/@role:admin\b/`). `roleTag("admin")` emits `@role:admin`.

Global setup mints `storage-state/<role>.json` via `~e2e/fixtures/session-mint` — no browser and no OTP. Mint only the roles a CI shard's `PLAYWRIGHT_TEST_PATHS` need.

| Do                                                                       | Don't                                                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `{ tag: roleTag("admin") }` on each role `describe` — typed from `ROLES` | `test.use({ storageState: storageStateFor(...) })`, or raw `{ tag: "@role:admin" }` strings |
| Smoke in `smoke.test.ts` (no role tag)                                   | Unauthenticated smoke in role-tagged files                                                  |

## Page objects

- POs live in `fixtures/po/` (`import from "~e2e/fixtures/po"`). **One PO per UI surface**; multi-surface flows stay in `helpers.ts`.
- Constructor takes `Page`. **No DB setup in POs.**
- Class name vs file name can differ — e.g. `SitePO` is defined in `site-settings.ts` (not `site.ts`). New POs: add `fixtures/po/<name>.ts` and export from `fixtures/po/index.ts` (see README).

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

Examples: `expectResourceId`, `expectResourceTitle`, `expectSiteName`, `expectUserRoleOnSite`.

## Violation smells

| Smell                                   | Fix                                                 |
| --------------------------------------- | --------------------------------------------------- |
| Hardcoded site ID or seed site name     | `provisionE2ESite` + assert returned `siteId`       |
| Duplicated wizard/invite flow in a test | `helpers.ts` or PO                                  |
| `test.use({ storageState })`            | `{ tag: roleTag(...) }` on `describe`               |
| Inline `db.selectFrom` in `*.test.ts`   | `fixtures/<entity>/db.ts` or `expect.ts`            |
| `page.waitForURL` for dashboard nav     | `DashboardPO.expectOnFolder` / `expectOnPageEditor` |
| Any other `page.*` in `*.test.ts`       | PO or helper for that surface                       |
