# E2E Scale & Coverage Spec

> **For agentic workers:** Implement as **stacked PRs via Graphite** (`gt create` / `gt stack submit`). Each PR below is one branch in the stack. Do not combine PRs unless explicitly marked as mergeable.
>
> **Required skills:** `feature-implement` for test PRs; follow `apps/studio/tests/e2e/README.md` conventions.

**Goal:** Make the E2E suite safe to run in parallel locally and ready to grow to ~40 test files, then add high-value coverage for the core CMS loop.

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

Keep existing `storageState` + `globalSetup`. No per-test login. Optionally parallelise sign-ins in `globalSetup` (`Promise.all`) as a small win in PR 3.

### Test pattern (unchanged)

Per UI surface: **one happy-path** + **one permission-gate** where the UI shows a signal (hidden button, redirect, disabled control).

---

## Stacked PR order

```
PR-1  fixtures foundation
  └─ PR-2  per-site isolation (migrate existing tests)
       └─ PR-3  playwright config tuning
            └─ PR-4  page objects
                 └─ PR-5  page module tests (edit + publish)
                      └─ PR-6  resource module tests (delete + move + search)
                           └─ PR-7  remaining site settings
                                └─ PR-8  user management completion
                                     └─ PR-9  collection module
                                          └─ PR-10 godmode actions
```

---

## PR-1: Shared fixtures foundation

**Branch:** `cursor/e2e-fixtures-foundation-a5d0`  
**Priority:** P0 — blocks everything else  
**Risk:** Low (refactor only, no new coverage)

### Scope

**Create:**
- `apps/studio/tests/e2e/fixtures/test.ts` — extended Playwright `test` fixture
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

### Acceptance criteria

- [ ] All 29 active E2E tests still pass (`pnpm dev:e2e` from `apps/studio`)
- [ ] No duplicated `dismissWelcomeModal` / welcome-modal `beforeEach` in test files
- [ ] `fixtures/test.ts` exports `test` and `expect` for new tests to import

### Notes

`test.extend` is optional in this PR — a plain shared module is fine. Add `test.extend` only if it reduces boilerplate without over-engineering.

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

### Acceptance criteria

- [ ] Two mutating test files can run concurrently without flake:  
      `pnpm exec playwright test site/settings-agency site/settings-notification --workers=2`
- [ ] All active tests pass
- [ ] No mutating test writes to site ID `1` except `site/list.test.ts`

---

## PR-3: Playwright config tuning

**Branch:** `cursor/e2e-playwright-config-a5d0`  
**Priority:** P1  
**Depends on:** PR-2

### Scope

**Modify:** `apps/studio/playwright.config.ts`

```typescript
export default defineConfig({
  // ...
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined, // start conservative; bump to 4 if CI stable
  // ...
})
```

**Modify:** `apps/studio/tests/e2e/global-setup.ts` — parallelise role sign-ins:
```typescript
await Promise.all(ROLES.map((role) => signInOnce(role, baseURL)))
```

**Do not add:** CI sharding or matrix jobs.

**Defer (see Future backlog):** Playwright projects per role group — not needed until test-file count makes `test.use({ storageState })` boilerplate painful (~15+ files).

### Acceptance criteria

- [ ] `pnpm dev:e2e` passes locally with default workers
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
  - `gotoSite(siteId)`, `openCreateMenu()`, `openResourceMenu(title)`, `clickCreatePage()` / `clickCreateFolder()`
- `apps/studio/tests/e2e/fixtures/page-editor.po.ts` — `PageEditorPO`
  - `expectLoaded()`, `fillBlock(label, text)`, `clickPublish()`, `expectPublishedToast()`, `openMetaSettingsTab()`
- `apps/studio/tests/e2e/fixtures/users.po.ts` — `UsersPO`
  - `goto(siteId)`, `openAddUser()`, `openUserMenu(email)`

**Modify:** Refactor one existing test file per PO to prove the API (e.g. `create-folder.test.ts` → `DashboardPO`, `invite-user.test.ts` → `UsersPO`). Do not rewrite all existing tests — just enough to validate.

### Acceptance criteria

- [ ] Three POs exported from `fixtures/`
- [ ] At least one existing test per PO uses it
- [ ] All tests pass

---

## PR-5: Page module — edit & publish

**Branch:** `cursor/e2e-page-edit-publish-a5d0`  
**Priority:** P1 (highest user-impact coverage)  
**Depends on:** PR-4

### New files

| File | Tests |
|------|-------|
| `page/edit-page.test.ts` | Admin opens seeded draft page → edits a text field → reload → content persisted |
| `page/publish-page.test.ts` | Publisher publishes draft → UI shows published state; Editor does not see Publish button |

### Setup

Use `provisionE2ESite` + `setupPageResource` (integration seed) to create a draft page in `beforeAll` instead of driving the create wizard (faster, fewer moving parts).

### Acceptance criteria

- [ ] Happy-path edit + publish covered
- [ ] One permission gate (editor cannot publish)
- [ ] Uses `PageEditorPO` and provisioned site
- [ ] DB assertion on `Resource.state` after publish

---

## PR-6: Resource module — delete, move, search

**Branch:** `cursor/e2e-resource-crud-a5d0`  
**Priority:** P1  
**Depends on:** PR-5

### New files

| File | Tests |
|------|-------|
| `resource/delete-resource.test.ts` | Admin deletes page via table menu → confirm modal → gone from table |
| `resource/move-resource.test.ts` | Admin moves page to folder via `MoveResourceModal` |
| `resource/search.test.ts` | Search by page title in `Searchbar` → click result → lands on page editor |

### Acceptance criteria

- [ ] Uses `DashboardPO` + provisioned site with folder + page seeded via integration helpers
- [ ] One permission gate per file where UI shows it (e.g. editor cannot delete root resource if gated)

---

## PR-7: Remaining site settings

**Branch:** `cursor/e2e-site-settings-a5d0`  
**Priority:** P2  
**Depends on:** PR-6

### New files (one per settings section)

| File | Happy path | Permission gate |
|------|------------|-----------------|
| `site/settings-colours.test.ts` | Admin changes primary colour, publish, persists | Publisher: no Publish button |
| `site/settings-navbar.test.ts` | Admin edits navbar item | Publisher: no Publish button |
| `site/settings-footer.test.ts` | Admin edits footer link | Publisher: no Publish button |
| `site/settings-integrations.test.ts` | Admin toggles an integration field | Publisher: no Publish button |
| `site/settings-redirects.test.ts` | Admin creates + deletes a redirect | Publisher: no Publish button |
| `site/settings-logo.test.ts` | Admin uploads logo (mock S3 if needed) | Publisher: no Publish button |

Use existing `SitePO.openSettingsSection()`. Each file provisions its own site.

**Optional consolidation:** If 6 files feels heavy, split into 2 PRs (PR-7a: colours/navbar/footer, PR-7b: integrations/redirects/logo).

### Acceptance criteria

- [ ] All 8 `SitePO` settings sections have E2E coverage (agency + notification already exist)
- [ ] Permission gate can be shared pattern: publisher visits settings page, Publish button absent

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

## PR-9: Collection module

**Branch:** `cursor/e2e-collection-a5d0`  
**Priority:** P2  
**Depends on:** PR-8

### New files

| File | Tests |
|------|-------|
| `collection/create-collection.test.ts` | Admin creates collection via wizard |
| `collection/create-collection-page.test.ts` | Editor creates collection page item |
| `collection/edit-collection-link.test.ts` | Editor edits collection link metadata |

Seed collection parent via integration `setupCollection` in `beforeAll` where it speeds up the test.

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

---

## Future backlog (not in this stack)

Track separately; do not start until PR-10 is merged:

| Item | Notes |
|------|-------|
| `page/schedule-publish.test.ts` | Schedule + cancel flows |
| `page/page-settings.test.ts` | Permalink change + redirect prompt |
| `page/content-lifecycle.test.ts` | Cross-surface smoke: create → edit → publish |
| `folder/edit-folder.test.ts` | Rename folder |
| `asset/upload-image.test.ts` | Requires S3 route mock |
| `gazette/*` | Requires Toppan fixture + S3 mock |
| `auth/logout.test.ts` | Logout → redirect to sign-in |
| `auth/unauthenticated-redirect.test.ts` | Protected route → sign-in |
| CI sharding | When suite runtime > ~15 min in CI |
| Playwright projects per role | When `test.use({ storageState })` is duplicated across 15+ files; add projects like `{ name: 'admin', use: { storageState: storageStateFor('admin') } }` to `playwright.config.ts` |
| `fixtures/reset.ts` expansion | Add reset helpers per settings surface as PR-7 lands (navbar, footer, integrations, redirects, logo) |
| `singpass.test.ts` | Out of scope until real Singpass test env exists |

---

## Agent checklist (every PR)

1. Branch off previous stack PR: `gt create cursor/<name>-a5d0`
2. Run `pnpm dev:e2e` from `apps/studio` before push
3. One concern per PR — no drive-by refactors
4. New test files follow `tests/e2e/<module>/<surface>.test.ts`
5. Mutating tests use `provisionE2ESite` / `teardownE2ESite`
6. Do not modify `singpass.test.ts`
7. Update `apps/studio/tests/e2e/README.md` only when adding new fixture APIs worth documenting

---

## Verification commands

```bash
# Full suite
cd apps/studio && pnpm dev:e2e

# Parallel smoke (after PR-2)
cd apps/studio && pnpm exec playwright test --workers=4

# Single file
cd apps/studio && pnpm exec playwright test tests/e2e/page/publish-page.test.ts
```

---

## Summary table

| PR | Priority | Effort | Unblocks |
|----|----------|--------|----------|
| PR-1 Fixtures + reset helpers | P0 | S | All new tests |
| PR-2 Per-site isolation | P0 | M | Parallel execution |
| PR-3 Playwright config | P1 | S | CI throughput |
| PR-4 Page objects | P1 | M | PR-5–10 ergonomics |
| PR-5 Page edit/publish | P1 | M | Core CMS coverage |
| PR-6 Resource delete/move/search | P1 | M | Content tree coverage |
| PR-7 Site settings (6 files) | P2 | L | Settings completeness |
| PR-8 User management | P2 | M | Collaborator flows |
| PR-9 Collection | P2 | M | Collection flows |
| PR-10 Godmode actions | P3 | S | Platform admin flows |

**Effort key:** S = <1 day agent time, M = 1–2 days, L = 2–3 days (settings split across files).
