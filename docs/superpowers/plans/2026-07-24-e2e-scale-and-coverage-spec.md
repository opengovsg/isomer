# E2E Scale & Coverage Spec

> **For agentic workers:** Implement as **stacked PRs via Graphite** (`gt create` / `gt stack submit`). Each PR below is one branch in the stack. Do not combine PRs unless explicitly marked as mergeable.
>
> **Required skills:** `feature-implement` for test PRs; follow `apps/studio/tests/e2e/README.md` and [E2E conventions](#e2e-conventions-skill) in `isomer-conventions`.

**Goal:** Make the E2E suite safe to run in parallel locally and ready to grow (~45–55 test files after PR-10), with dense coverage of the core CMS loop (edit/publish/tree ops) rather than thin one-happy-path stubs.

**Non-goals (explicitly deferred):**
- `singpass.test.ts` — keep all 4 tests `test.skip`; do not un-skip or rewrite
- CI sharding across multiple jobs
- `test.describe.configure({ mode: 'serial' })` — not needed once per-site isolation lands
- Translating audit-log, validation-edge-case, or SearchSG side-effect scenarios (stay in integration tests)

---

## Architecture decisions

### Per-site isolation (replaces shared site ID 1 for mutating tests)

| Test category | Site strategy |
|---------------|---------------|
| **Read-only / seed-dependent** | Keep using seed site ID `1` ("Sample Site") — e.g. `site/list.test.ts`, `godmode/access.test.ts` |
| **Mutating** (settings, create, invite, delete, publish, …) | Provision a **dedicated site per test file** in `beforeAll`, tear down in `afterAll` |

Provisioning uses integration seed helpers (`tests/integration/helpers/seed/index.ts`):
- `setupSite()` — creates site with navbar/footer
- `setupAdminPermissions` / `setupEditorPermissions` / `setupPublisherPermissions` — grant roles to `TEST_EMAILS.*` users

```typescript
// Target API in fixtures/site.ts (PR 2)
export type ProvisionedSite = {
  siteId: number
  siteName: string
}

export const provisionE2ESite = async (opts: {
  admin?: boolean
  editor?: boolean
  publisher?: boolean
}): Promise<ProvisionedSite> => { /* ... */ }

export const teardownE2ESite = async (siteId: number): Promise<void> => { /* ... */ }
```

Use `test.info().parallelIndex` only if two workers within the same file need distinct sites (unlikely initially). **One site per file is sufficient** for parallel file execution.

### Auth

Keep existing `storageState` + `globalSetup`. No per-test login. Parallelise sign-ins in `globalSetup` (`Promise.all`) in PR-3.

**Role projects (PR-3):** Replace per-file `test.use({ storageState })` with Playwright projects — one project per role, plus an `unauthenticated` project for smoke tests. Multi-role files use `@role` tags on `test.describe` blocks matched via project `grep`.

### Test pattern (density by surface class)

| Surface class | Required coverage | Examples |
|---------------|-------------------|----------|
| **Core mutating** (edit / publish / delete / move) | Happy path + **persist assert** (reload and/or DB) + one permission gate where the UI shows a signal | Page edit, publish, resource delete/move |
| **Settings / secondary** | Happy path + permission gate | Site colours, navbar, invite |
| **Shared permission signal** | Prefer **one** shared gate file over repeating the same gate N times | Publisher cannot Publish on settings → single `settings-permissions.test.ts` |

Do **not** translate validation-error, audit-log, or SearchSG side-effect scenarios — those stay in integration tests.

### Module ownership (create / edit / tree ops)

| Concern | Owns it |
|---------|---------|
| Create Page / Folder | Existing `page/create-page.test.ts`, `resource/create-folder.test.ts` (expand nested create on the page file if root-only) |
| Edit / publish / schedule / page settings (normal **Page**) | **PR-5** |
| Delete / move / search (+ folder rename) across resource types | **PR-6** — does **not** own create |
| Collection create + edit (collection page & link) | **PR-9** |

### E2E conventions skill

Maintain **one** living convention file for the whole E2E stack:

- **File:** `.claude/skills/isomer-conventions/conventions/e2e-tests.md`
- **Catalog:** link it once under **Testing** in `.claude/skills/isomer-conventions/SKILL.md`

**PR-1** creates `e2e-tests.md` with the initial blessed patterns (fixtures layout, helpers vs page objects, welcome modal, happy-path + permission-gate pattern, file naming).

**Later PRs** append or revise `e2e-tests.md` only when the stack introduces a **new reusable convention** — not when merely adding test coverage.

| Update `e2e-tests.md`? | Example |
|------------------------|---------|
| Yes | PR-2 adds per-site isolation; PR-3 adds role projects + `@role` tags; PR-4 adds page-object rules; **PR-5 documents density-by-surface-class** |
| No | PR-5 adds `edit-page.test.ts` cases; PR-8 adds invite cleanup that follows existing patterns |

When updating, add a dated subsection (e.g. `## Per-site isolation (PR-2)`) rather than spawning new convention files.

---

## Stacked PR order

```
docs  cursor/e2e-scale-spec-a5d0          ← this spec (living doc + e2e-tests.md convention)
  └─ PR-1  fixtures foundation
       └─ PR-2  per-site isolation (migrate existing tests)
            └─ PR-3  playwright config + role projects
            └─ PR-4  page objects
                 └─ PR-5  page module (edit folder-page + publish/schedule/settings + lifecycle)
                      └─ PR-6  resource tree ops (multi-type delete/move + search + folder rename)
                           └─ PR-7  remaining site settings (shared publisher gate + bulk redirects)
                                └─ PR-8  user management completion
                                     └─ PR-9  collection module (create + edit page/link)
                                          └─ PR-10 godmode actions
                                               └─ PR-11 CI parallelism (tentative — only if E2E job is slow)
```

---

## PR-1: Shared fixtures foundation

**Branch:** `cursor/e2e-fixtures-foundation-a5d0`  
**Priority:** P0 — blocks everything else  
**Risk:** Low (refactor only, no new coverage)

### Scope

**Create:**
- `apps/studio/tests/e2e/fixtures/user.ts` — `ensureUserOnboarded(email)` (name + phone set)
- `apps/studio/tests/e2e/fixtures/reset.ts` — shared DB reset helpers (site-agnostic; take `siteId` arg):
  - `resetSiteAgencySettings(siteId)` — reset `Site.name` + `config.siteName`
  - `resetSiteNotification(siteId)` — reset notification banner fields
  - `resetSiteTheme(siteId)` — reset theme to seed default (for colours tests)
  - Re-export `ensureUserOnboarded` from `user.ts` for convenience
- `apps/studio/tests/e2e/fixtures/helpers.ts` — move shared flows out of individual test files:
  - `createPageViaWizard(page, { startUrl, title })`
  - `createFolderViaWizard(page, { siteId, title })`
  - `openInviteModal(page, siteId)`
  - `inviteCollaborator(page, { email, role })`

**Modify:**
- Migrate `page/create-page.test.ts`, `resource/create-folder.test.ts`, `user/invite-user.test.ts` to import from fixtures (delete local copies)
- Replace inline welcome-modal `beforeEach` blocks with `ensureUserOnboarded(TEST_EMAILS.<role>)`

**Do not touch:** `singpass.test.ts`

**Conventions skill:** Create `.claude/skills/isomer-conventions/conventions/e2e-tests.md` and link it under **Testing** in `SKILL.md` (see [E2E conventions skill](#e2e-conventions-skill)).

> **If PR-1 already merged without `e2e-tests.md`:** backfill in PR-2.

### Acceptance criteria

- [ ] All 29 active E2E tests still pass (`pnpm dev:e2e` from `apps/studio`)
- [ ] No duplicated `dismissWelcomeModal` / welcome-modal `beforeEach` in test files
- [ ] `e2e-tests.md` created and linked in `SKILL.md`

### Notes

`test.extend` is deferred until a custom fixture is actually needed (e.g. auto-provisioned site). Import `test` / `expect` from `@playwright/test` directly — no `fixtures/test.ts` re-export.

---

## PR-2: Per-site isolation

**Branch:** `cursor/e2e-per-site-isolation-a5d0`  
**Priority:** P0 — blocks parallel execution and most new tests  
**Depends on:** PR-1

### Scope

**Create:**
- `apps/studio/tests/e2e/fixtures/site.ts` — `provisionE2ESite`, `teardownE2ESite`
- Thin re-export or wrapper in `fixtures/seed.ts` calling integration `setupSite` + permission helpers

**Modify — migrate to provisioned site:**
| File | Change |
|------|--------|
| `site/settings-agency.test.ts` | `beforeAll` provision site; `beforeEach` → `resetSiteAgencySettings(siteId)` from `fixtures/reset.ts` |
| `site/settings-notification.test.ts` | `beforeAll` provision site; `beforeEach` → `resetSiteNotification(siteId)` |
| `site/admin.test.ts` | provision site for core/migrator access tests (or keep site 1 if only testing redirect — evaluate) |
| `page/create-page.test.ts` | provision site with admin/editor/publisher permissions |
| `resource/create-folder.test.ts` | provision site |
| `user/invite-user.test.ts` | provision site |

**Keep on seed site ID 1:**
| File | Reason |
|------|--------|
| `site/list.test.ts` | Asserts "Sample Site" from Prisma seed |
| `smoke.test.ts` | No DB mutation |
| `godmode/access.test.ts` | Route guards only, no site mutation |
| `singpass.test.ts` | Skipped, do not modify |

**Deprecate:** `getSeedSiteId()` for mutating tests. Keep export for read-only seed tests; add JSDoc: `@deprecated for mutating tests — use provisionE2ESite()`.

### Teardown strategy

Delete site row (cascade should clean resources). If FK constraints block delete, document and use soft-delete or explicit child cleanup matching integration test patterns.

**Conventions skill:** Add **Per-site isolation** subsection to `e2e-tests.md`.

### Acceptance criteria

- [ ] Two mutating test files can run concurrently without flake:  
      `pnpm exec playwright test site/settings-agency site/settings-notification --workers=2`
- [ ] All active tests pass
- [ ] No mutating test writes to site ID `1` except `site/list.test.ts`

---

## PR-3: Playwright config tuning + role projects

**Branch:** `cursor/e2e-playwright-config-a5d0`  
**Priority:** P1  
**Depends on:** PR-2

### Scope

**Modify:** `apps/studio/playwright.config.ts`

Replace the single `e2e` project with role-based projects. Only **CI sharding** is deferred — projects ship in this PR.

```typescript
import { ROLES, storageStateFor } from "./tests/e2e/fixtures/auth"

const baseUse = {
  ...devices["Desktop Chrome"],
  baseURL: baseUrl,
  headless: opts.headless,
  video: "retain-on-failure" as const,
}

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined, // start conservative; bump to 4 if CI stable
  globalSetup: "./tests/e2e/global-setup.ts",
  testDir: "./tests/e2e",
  projects: [
    {
      name: "unauthenticated",
      testMatch: /smoke\.test\.ts/,
      use: { ...baseUse },
    },
    // singpass.test.ts stays in unauthenticated project but remains skipped
    {
      name: "singpass",
      testMatch: /singpass\.test\.ts/,
      use: { ...baseUse },
    },
    ...ROLES.map((role) => ({
      name: role,
      grep: new RegExp(`@${role}\\b`),
      use: { ...baseUse, storageState: storageStateFor(role) },
    })),
  ],
})
```

**Tag convention for multi-role files:**

```typescript
test.describe("admin", { tag: "@admin" }, () => {
  // remove test.use({ storageState: storageStateFor("admin") })
  test("...", async ({ page }) => { /* ... */ })
})

test.describe("publisher", { tag: "@publisher" }, () => {
  test("...", async ({ page }) => { /* ... */ })
})
```

**Single-role files:** add `{ tag: "@admin" }` on the outer `test.describe` (or file-level via `test.describe.configure`) and remove top-level `test.use({ storageState })`.

**Migrate existing tests:**

| File | Migration |
|------|-----------|
| `smoke.test.ts` | No tags; picked up by `unauthenticated` project |
| `singpass.test.ts` | Do not modify tests; `singpass` project only |
| `site/list.test.ts` | Split describes: `@editor`, `@nomember` |
| `site/settings-agency.test.ts` | `@admin` block + `@publisher` block; remove both `test.use` |
| `site/settings-notification.test.ts` | `@admin` |
| `site/admin.test.ts` | `@core`, `@migrator`, `@editor`, `@publisher`, `@admin`, `@nomember` per describe loop |
| `page/create-page.test.ts` | `@admin`, `@publisher`, `@editor` per describe |
| `resource/create-folder.test.ts` | `@admin` |
| `user/invite-user.test.ts` | `@admin` |
| `godmode/access.test.ts` | `@core`, `@migrator`, `@admin` per describe |

**Modify:** `apps/studio/tests/e2e/README.md` — document tag convention; new tests must use `@role` tags, not `test.use({ storageState })`.

**Modify:** `apps/studio/tests/e2e/global-setup.ts` — parallelise role sign-ins:
```typescript
await Promise.all(ROLES.map((role) => signInOnce(role, baseURL)))
```

**Do not add:** CI sharding in this PR — that is PR-11 (tentative last step, conditional on CI runtime).

**Conventions skill:** Add **Role projects and tags** subsection to `e2e-tests.md`.

### Acceptance criteria

- [ ] `pnpm dev:e2e` passes — all 29 active tests green across role projects
- [ ] No remaining `test.use({ storageState: storageStateFor(...) })` in test files (except `singpass.test.ts` if untouched)
- [ ] `pnpm exec playwright test --project=admin` runs only `@admin`-tagged tests
- [ ] `pnpm exec playwright test --project=unauthenticated` runs smoke only
- [ ] CI E2E job passes with `workers: 2`
- [ ] `globalSetup` runtime reduced (serial 6 logins → parallel)

---

## PR-4: Page objects

**Branch:** `cursor/e2e-page-objects-a5d0`  
**Priority:** P1  
**Depends on:** PR-3

### Scope

**Create:**
- `apps/studio/tests/e2e/fixtures/dashboard.po.ts` — `DashboardPO`
  - `gotoSite(siteId)`, `openCreateMenu()`, `openResourceMenu(title)`, `clickCreatePage()` / `clickCreateFolder()`, `openCollectionResourceMenu(title)` (collection table)
- `apps/studio/tests/e2e/fixtures/page-editor.po.ts` — `PageEditorPO`
  - `expectLoaded()`, `fillBlock(label, text)`, `clickPublish()`, `expectPublishedToast()`, `openMetaSettingsTab()`, schedule helpers as needed by PR-5
- `apps/studio/tests/e2e/fixtures/users.po.ts` — `UsersPO`
  - `goto(siteId)`, `openAddUser()`, `openUserMenu(email)`

**Defer to PR-9:** `CollectionLinkPO` (or link-editor methods) for `/links/[linkId]` — not required until collection link edit lands.

**Modify:** Refactor one existing test file per PO to prove the API (e.g. `create-folder.test.ts` → `DashboardPO`, `invite-user.test.ts` → `UsersPO`). Do not rewrite all existing tests — just enough to validate.

**Conventions skill:** Add **Page objects** subsection to `e2e-tests.md`.

### Acceptance criteria

- [ ] Three POs exported from `fixtures/`
- [ ] At least one existing test per PO uses it
- [ ] All tests pass

---

## PR-5: Page module — edit, publish, schedule, settings

**Branch:** `cursor/e2e-page-edit-publish-a5d0`  
**Priority:** P1 (highest user-impact coverage)  
**Depends on:** PR-4

> **Out of scope for PR-5:** Collection page / collection link edit — those belong in **PR-9**. Publish/schedule coverage here uses a normal **Page** only (shared PublishingModal).

### New files

| File | Tests |
|------|-------|
| `page/edit-page.test.ts` | Admin opens a **Page inside a folder** → edits a text field → reload → content persisted |
| `page/publish-page.test.ts` | Publisher publishes draft → UI shows published state + DB `Resource.state`; Editor does not see Publish button |
| `page/schedule-publish.test.ts` | Publisher schedules publish → scheduled indicator; cancel schedule → back to draft UI |
| `page/page-settings.test.ts` | Admin changes permalink (or title) via `PageSettingsModal` → redirect prompt / persisted settings as UI shows |
| `page/content-lifecycle.test.ts` | Journey: create page (wizard) → edit → publish (folder Page). One vertical slice only |

### Also modify (create gap)

If `page/create-page.test.ts` only creates at site root, add an `@admin` (or editor) case: **create page inside a folder**. Still page-module create ownership — not PR-6.

### Setup

Prefer integration seed for non-wizard tests:
- `provisionE2ESite` + `setupFolder` + `setupPageResource({ parentId: folder.id, resourceType: Page })` for edit/publish/schedule/settings
- Drive the create wizard **only** in `content-lifecycle` and create-page tests

**Conventions skill:**
1. Add **Integration seed for setup** subsection (prefer seed over wizard when the test is not about the wizard).
2. Add **Density by surface class** subsection (document the architecture table above).

### Acceptance criteria

- [ ] Folder-scoped Page edit + persist covered
- [ ] Publish happy path + editor permission gate + DB assert on `Resource.state`
- [ ] Schedule + cancel covered
- [ ] Page settings surface covered
- [ ] One create → edit → publish lifecycle journey
- [ ] Nested create-page case present if it was previously root-only
- [ ] Uses `PageEditorPO` / `DashboardPO` and provisioned sites
- [ ] No collection-page or collection-link edit tests in this PR

---

## PR-6: Resource tree ops — multi-type delete, move, search + folder rename

**Branch:** `cursor/e2e-resource-crud-a5d0`  
**Priority:** P1  
**Depends on:** PR-5

> **Create is out of scope.** Page/folder create stay on existing files; collection create stays in PR-9. PR-6 seeds resources via integration helpers and exercises **delete / move / search / folder rename** only.

### New files

| File | Tests |
|------|-------|
| `resource/delete-resource.test.ts` | `@admin` describes for **Page**, **Folder** (cascade copy + children gone), **Collection** (cascade copy), and **one** collection item (**CollectionPage** *or* **CollectionLink** via collection table). One shared permission gate (`Can do="delete"`) — Editor cannot delete when UI hides/disables. |
| `resource/move-resource.test.ts` | `@admin` describes: **Page → folder**, **Folder → folder** (or to root), **one** collection item → another collection. One shared move permission gate where UI shows it. |
| `resource/search.test.ts` | Search by page title in `Searchbar` → click result → lands on page editor |
| `folder/edit-folder.test.ts` | Admin renames folder via `FolderSettingsModal` → title persists |

### Skip (unless cheap one-liner)

- RootPage / IndexPage delete
- Search system page (disabled menu items) — optional assert that Delete/Move are disabled
- Moving a whole Collection — only if product path is clearly supported and valuable

### Setup

Seed with `setupFolder`, `setupPageResource`, `setupCollection`, `setupCollectionPage` / `setupCollectionLink` as needed. Do **not** drive create wizards inside delete/move tests.

Use `DashboardPO` (resource + collection table menus). Collection delete/move for items may need collection-table helpers on `DashboardPO` from PR-4.

### Acceptance criteria

- [ ] Delete covered for Page, Folder, Collection, and one collection item type
- [ ] Move covered for Page, Folder, and one collection item type
- [ ] Search happy path covered
- [ ] Folder rename covered
- [ ] One delete permission gate + one move permission gate (not per-type duplicates)
- [ ] Provisioned site; no create-wizard usage in delete/move files

---

## PR-7: Remaining site settings

**Branch:** `cursor/e2e-site-settings-a5d0`  
**Priority:** P2  
**Depends on:** PR-6

### New files

| File | Happy path | Notes |
|------|------------|-------|
| `site/settings-colours.test.ts` | Admin changes primary colour, publish, persists | |
| `site/settings-navbar.test.ts` | Admin edits navbar item | |
| `site/settings-footer.test.ts` | Admin edits footer link | |
| `site/settings-integrations.test.ts` | Admin toggles an integration field | No SearchSG side-effect asserts |
| `site/settings-redirects.test.ts` | Admin creates + deletes a single redirect | |
| `site/settings-redirects-bulk.test.ts` | Admin bulk-uploads redirects via `BulkUploadRedirectsModal` → success | Distinct surface from single redirect CRUD |
| `site/settings-logo.test.ts` | Admin uploads logo (mock S3 if needed) | |
| `site/settings-permissions.test.ts` | Publisher visits a settings section → Publish button absent | **One** shared gate for all settings Publish CTAs — do not repeat per file |

Use existing `SitePO.openSettingsSection()`. Each mutating file provisions its own site (permissions file may reuse one section URL).

**Optional consolidation:** If file count feels heavy, split into 2 PRs (PR-7a: colours/navbar/footer + permissions, PR-7b: integrations/redirects/bulk/logo).

**Conventions skill:** Update `e2e-tests.md` only if a new settings pattern emerges (e.g. shared `settings-permissions` gate, or a new `resetSite*` helper).

### Acceptance criteria

- [ ] All 8 `SitePO` settings sections have a happy-path E2E (agency + notification already exist)
- [ ] Bulk redirects covered
- [ ] Publisher Publish-button gate exists **once** in `settings-permissions.test.ts`
- [ ] No duplicated publisher-gate blocks copy-pasted into every settings file

---

## PR-8: User management completion

**Branch:** `cursor/e2e-user-management-a5d0`  
**Priority:** P2  
**Depends on:** PR-7

### New files

| File | Tests |
|------|-------|
| `user/edit-user-role.test.ts` | Admin promotes Editor → Publisher via `EditUserModal` |
| `user/remove-user.test.ts` | Admin removes collaborator via `RemoveUserModal` |
| `user/resend-invite.test.ts` | Admin resends invite to pending user |
| `user/invite-permissions.test.ts` | Publisher/Editor: "Add new user" button absent |

### Acceptance criteria

- [ ] Uses `UsersPO`
- [ ] Unique invitee emails per test (`crypto.randomUUID()`)
- [ ] `afterEach` cleanup of created users

---

## PR-9: Collection module — create + edit

**Branch:** `cursor/e2e-collection-a5d0`  
**Priority:** P2  
**Depends on:** PR-8

> Owns **all** collection-specific create and edit flows (including collection page and collection link). Delete/move of collection resources stay in PR-6.

### New files

| File | Tests |
|------|-------|
| `collection/create-collection.test.ts` | Admin creates collection via wizard |
| `collection/create-collection-page.test.ts` | Editor/Admin creates collection **page** via wizard |
| `collection/create-collection-link.test.ts` | Editor/Admin creates collection **link** via wizard (type screen → link) |
| `collection/edit-collection-page.test.ts` | Editor edits collection page (article metadata and/or body) → reload → persisted |
| `collection/edit-collection-link.test.ts` | Editor edits collection link metadata on `/links/[linkId]` → reload → persisted |

Seed collection parent via `setupCollection` in `beforeAll` where it speeds up edit tests. Add `CollectionLinkPO` (or link-editor helpers) in this PR if not introduced earlier.

Publish of collection pages is **not** required here if PR-5 already covered PublishingModal on a normal Page; optional single publish assert only if collection-page publish UI diverges.

### Acceptance criteria

- [ ] Create collection + collection page + collection link covered
- [ ] Edit collection page + collection link covered (persist/reload)
- [ ] Uses provisioned site + integration seed where appropriate
- [ ] All new collection tests pass

---

## PR-10: Godmode actions

**Branch:** `cursor/e2e-godmode-actions-a5d0`  
**Priority:** P3  
**Depends on:** PR-9

### New files

| File | Tests |
|------|-------|
| `godmode/create-site.test.ts` | Core admin creates site → toast → redirects to `/sites/{id}` |
| `godmode/publishing.test.ts` | Core admin clicks publish on a site → success toast (CodeBuild is async; assert UI only) |
| `godmode/whitelist.test.ts` | Migrator bulk-whitelists vendor emails → success toast |

Route access already covered by `godmode/access.test.ts`. These PRs cover **actions**.

### Acceptance criteria

- [ ] Godmode action happy-paths covered

---

## PR-11: CI parallelism (tentative — conditional)

**Branch:** `cursor/e2e-ci-sharding-a5d0`  
**Priority:** P4 — last step in stack  
**Depends on:** PR-10  
**Status:** **Do not start unless the go/no-go check passes.**

### Go / no-go (required before opening this PR)

After PR-10 merges, measure the `end-to-end-tests` job duration on `main` over **3 consecutive green runs**.

| Condition | Action |
|-----------|--------|
| Median E2E job duration **< 15 min** | **Skip PR-11.** Close or don't open. Revisit if duration crosses 15 min later. |
| Median E2E job duration **≥ 15 min** | Proceed with PR-11. |

Record the measured duration in the PR description when opening.

**Why 15 min:** Balances CI feedback loop vs complexity of multi-job sharding (duplicate container startup, artifact merging, flakiness surface).

### Prerequisites (must already be merged)

- PR-2 per-site isolation — shards share one Postgres; tests must not collide on site ID 1
- PR-3 role projects + `workers: 2` — local parallelism proven before cross-job parallelism

### Scope

**Modify:** `.github/workflows/ci.yml` — split `end-to-end-tests` into a matrix:

```yaml
end-to-end-tests:
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2, 3]
  steps:
    # ... existing setup (checkout, playwright install, .env, build, containers, seed) ...
    - name: Run Playwright tests (shard ${{ matrix.shard }}/3)
      run: >-
        pnpm exec turbo test-ci:e2e --filter=isomer-studio --env-mode=loose
        -- --shard=${{ matrix.shard }}/3
```

Start with **3 shards**; bump to 4 only if still ≥ 15 min after sharding.

Each matrix job:
- Starts its own Postgres/Mockpass containers (existing `setup:test`)
- Runs `db:seed` + `globalSetup` independently (acceptable overhead)
- Uploads test-results artifact with shard suffix: `e2e-test-results-${{ github.run_id }}-shard-${{ matrix.shard }}`

**Modify:** `post-pr-comment.yml` (if needed) — aggregate or link multiple shard artifacts.

**Do not change:** Playwright project structure or test files unless sharding exposes a shared-state bug (fix in a separate PR).

**Conventions skill (if PR-11 ships):** Add **CI sharding** subsection to `e2e-tests.md`.

### Acceptance criteria

- [ ] Go/no-go documented in PR with median runtime from 3 `main` runs
- [ ] 3-shard matrix reduces wall-clock E2E job by ≥ 30% vs single job
- [ ] No new flakes over 3 consecutive CI runs on the PR branch
- [ ] All shards green; combined test count matches pre-shard total

### If skipped

Leave a note in `apps/studio/tests/e2e/README.md`:

> CI sharding (PR-11) deferred — E2E job median runtime below 15 min as of \<date\>. Revisit when runtime exceeds threshold.

---

## Future backlog (not in this stack)

Track separately; do not start until PR-10 is merged (PR-11 excepted — see go/no-go above):

| Item | Notes |
|------|-------|
| `auth/logout.test.ts` | Logout → redirect to sign-in (cheap; candidate to pull earlier after PR-3 if capacity) |
| `auth/unauthenticated-redirect.test.ts` | Protected route → sign-in |
| `asset/upload-image.test.ts` | Requires S3 route mock (logo settings may cover a subset) |
| `gazette/*` | Requires Toppan fixture + S3 mock |
| `fixtures/reset.ts` expansion | Add reset helpers per settings surface as PR-7 lands (navbar, footer, integrations, redirects, logo) |
| `singpass.test.ts` | Out of scope until real Singpass test env exists |
| Search-page locked menu | Optional one-liner: Delete/Move/Settings disabled on `/search` system page |

**Promoted into this stack (no longer backlog):** schedule-publish, page-settings, content-lifecycle, folder edit/rename, multi-type delete/move, bulk redirects, settings-permissions consolidation, collection page/link create+edit.

---

## Agent checklist (every PR)

1. Branch off previous stack PR: `gt create cursor/<name>-a5d0`
2. Run `pnpm dev:e2e` from `apps/studio` before push
3. One concern per PR — no drive-by refactors
4. New test files follow `tests/e2e/<module>/<surface>.test.ts` and tag describes with `@role` (not `test.use({ storageState })`)
5. Mutating tests use `provisionE2ESite` / `teardownE2ESite`
6. Respect [density by surface class](#test-pattern-density-by-surface-class) and [module ownership](#module-ownership-create--edit--tree-ops)
7. Do not modify `singpass.test.ts`
8. Update `apps/studio/tests/e2e/README.md` only when adding new fixture APIs worth documenting
9. Update `conventions/e2e-tests.md` only when the PR introduces a **new reusable convention** (see [E2E conventions skill](#e2e-conventions-skill))

---

## Verification commands

```bash
# Full suite
cd apps/studio && pnpm dev:e2e

# Parallel smoke (after PR-2)
cd apps/studio && pnpm exec playwright test --workers=4

# Single role
cd apps/studio && pnpm exec playwright test --project=admin

# Unauthenticated only
cd apps/studio && pnpm exec playwright test --project=unauthenticated
```

---

## Summary table

| PR | Priority | Effort | Unblocks |
|----|----------|--------|----------|
| PR-1 Fixtures + reset helpers | P0 | S | All new tests |
| PR-2 Per-site isolation | P0 | M | Parallel execution |
| PR-3 Playwright config + role projects | P1 | M | Parallel runs, no test.use boilerplate |
| PR-4 Page objects | P1 | M | PR-5–10 ergonomics |
| PR-5 Page edit/publish/schedule/settings + lifecycle | P1 | L | Core CMS loop (normal Page only) |
| PR-6 Multi-type delete/move + search + folder rename | P1 | L | Content tree coverage (no create) |
| PR-7 Site settings + shared gate + bulk redirects | P2 | L | Settings completeness |
| PR-8 User management | P2 | M | Collaborator flows |
| PR-9 Collection create + edit (page & link) | P2 | M | Collection flows |
| PR-10 Godmode actions | P3 | S | Platform admin flows |
| PR-11 CI parallelism | P4 | M | **Tentative** — only if E2E job median ≥ 15 min after PR-10 |

**Effort key:** S = <1 day agent time, M = 1–2 days, L = 2–3 days.

**PR-11 is optional:** Agents should complete PR-1–10 first, measure CI runtime, then either implement PR-11 or document skip per go/no-go table.
