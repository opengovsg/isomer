# Integration → E2E Test Migration (Template: site module)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reusable Playwright pattern for translating integration test scenarios into UI-driven e2e tests, and apply it to the `site.router` module as the template. After this plan lands, the same pattern can be repeated module-by-module (page, resource, collection, folder, user, asset, etc.) without redesigning infrastructure.

**Architecture:**
- **Auth via `storageState`**: Each role (editor, publisher, admin, no-access user) signs in once during Playwright `globalSetup` via the existing OTP + Mockpass flow. Resulting cookies are saved to JSON; each test reuses them via `test.use({ storageState })`. No per-test login cost; no forged iron-session cookies.
- **Direct DB seeding for state**: Reuse the integration test seed helpers (`setupSite`, `setupEditorPermissions`, `setupAdminPermissions`, etc.) to put the DB in the desired state before driving the UI. The UI then exercises only the specific behavior under test (form submit, navigation, permission gate). This keeps tests fast and avoids exhaustive UI-only setup chains.
- **Coverage scope per module**: For each integration `describe` block, write **one happy-path e2e** that exercises the user-facing UI plus **one permission-gate e2e** (403/404 for a wrong-role user). Leave edge-case/argument-validation scenarios in the integration suite — they don't gain meaningful signal at the e2e layer and triple test runtime.

**Tech Stack:** Playwright 1.x, Next.js 16, tRPC, Kysely + Postgres (testcontainers/.env.test DB), Mockpass, iron-session, Chakra UI.

---

## Translation Methodology (read before doing tasks)

Each integration `describe(<routerProcedure>, ...)` becomes **one e2e file** named after the user-visible surface (not the procedure). Within that file:

| Integration scenario | E2E translation |
|---|---|
| `should throw 401 if not logged in` | Skip. Unauthenticated state is covered once by a single auth-redirect e2e. |
| `should throw 403 if user does not have <perm>` | One test per role boundary worth verifying in UI (publisher trying to save admin-only form sees disabled control or error toast). |
| `should <do the thing> if user is <role>` | The happy-path e2e: drive the form, submit, assert toast + persisted state (re-fetch via UI or DB). |
| `should generate an audit log entry` | Stay in integration tests. No UI signal. |
| `should reject an invalid <field>` | One representative validation per form via UI; rest stay in integration. |

**Test file layout convention:**
```
tests/e2e/
  fixtures/
    login.ts           (existing)
    auth.ts            (new — storageState constants + role types)
    seed.ts            (new — re-exports integration seed helpers + an e2e-safe wrapper)
    site.po.ts         (new — Page Object: navigateToSettings(siteId, section), saveSettings())
  global-setup.ts      (new — signs in each role, writes storageState JSONs)
  storage-state/       (new, gitignored — populated by global-setup)
    editor.json
    publisher.json
    admin.json
    nomember.json
  site/                (new — one file per UI surface)
    list.test.ts
    settings-agency.test.ts
    settings-theme.test.ts
    settings-notification.test.ts
    permissions.test.ts
```

---

## File Structure

**New files:**
- `apps/studio/tests/e2e/global-setup.ts` — runs `signInAndSave(role)` for every role once
- `apps/studio/tests/e2e/fixtures/auth.ts` — exports `STORAGE_STATE` paths + `Role` enum
- `apps/studio/tests/e2e/fixtures/seed.ts` — exports `seedAdminUser()`, `seedNoMemberUser()`, `getSeedSiteId()` — thin wrappers that reuse `tests/integration/helpers/seed/index.ts`
- `apps/studio/tests/e2e/fixtures/site.po.ts` — Page Object for site nav + settings forms
- `apps/studio/tests/e2e/site/list.test.ts`
- `apps/studio/tests/e2e/site/settings-agency.test.ts`
- `apps/studio/tests/e2e/site/settings-theme.test.ts`
- `apps/studio/tests/e2e/site/settings-notification.test.ts`
- `apps/studio/tests/e2e/site/permissions.test.ts`

**Modified files:**
- `apps/studio/playwright.config.ts` — register `globalSetup`, configure default `storageState` per-project or per-test
- `apps/studio/.gitignore` (or `tests/e2e/storage-state/.gitignore`) — ignore `storage-state/*.json`
- `apps/studio/tests/e2e/site-settings.test.ts` — superseded by `site/settings-agency.test.ts`; delete in Task 11 after the new test covers the same flow

**Untouched:**
- `tests/integration/helpers/seed/index.ts` — imported by e2e fixtures as-is
- `src/server/modules/site/__tests__/site.router.test.ts` — kept; e2e adds coverage, doesn't replace

---

## Tasks

### Task 1: Add storage-state directory + gitignore

**Files:**
- Create: `apps/studio/tests/e2e/storage-state/.gitignore`

- [ ] **Step 1: Create gitignored directory**

Create `apps/studio/tests/e2e/storage-state/.gitignore` with:

```
*
!.gitignore
```

- [ ] **Step 2: Commit**

```bash
git add apps/studio/tests/e2e/storage-state/.gitignore
git commit -m "test(e2e): add gitignored storage-state directory for auth fixtures"
```

---

### Task 2: Define role enum + storage paths

**Files:**
- Create: `apps/studio/tests/e2e/fixtures/auth.ts`

- [ ] **Step 1: Write the fixture module**

```typescript
import path from "path"

export const ROLES = ["editor", "publisher", "admin", "nomember"] as const
export type Role = (typeof ROLES)[number]

export const TEST_EMAILS: Record<Role, string> = {
  editor: "editor@open.gov.sg",
  publisher: "publisher@open.gov.sg",
  admin: "admin-e2e@open.gov.sg",
  nomember: "nomember-e2e@open.gov.sg",
}

const STORAGE_DIR = path.join(__dirname, "..", "storage-state")

export const storageStateFor = (role: Role): string =>
  path.join(STORAGE_DIR, `${role}.json`)
```

- [ ] **Step 2: Commit**

```bash
git add apps/studio/tests/e2e/fixtures/auth.ts
git commit -m "test(e2e): add role enum and storage-state path helpers"
```

---

### Task 3: Add e2e seed wrapper (idempotent role + user setup)

**Files:**
- Create: `apps/studio/tests/e2e/fixtures/seed.ts`

Why: The default DB seed (`prisma/seed.ts`) only creates editor + publisher with their respective roles on site id 1. E2E needs an Admin and a no-access user. We do this with idempotent INSERTs so that re-running global-setup against an already-seeded DB doesn't fail.

- [ ] **Step 1: Write the wrapper**

```typescript
import { createId } from "@paralleldrive/cuid2"
import { sql } from "kysely"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS } from "./auth"

const SEED_SITE_ID = 1

export const getSeedSiteId = () => SEED_SITE_ID

/**
 * Idempotent: inserts user if missing, then ensures a ResourcePermission
 * with `role` on the seed site exists (re-activating if soft-deleted).
 */
const ensureUserWithRole = async (
  email: string,
  role: (typeof RoleType)[keyof typeof RoleType] | null,
) => {
  const user = await db
    .insertInto("User")
    .values({
      id: createId(),
      email,
      name: "test-e2e",
      phone: "82345678",
    })
    .onConflict((oc) =>
      oc
        .columns(["email", "deletedAt"])
        .doUpdateSet((eb) => ({ email: eb.ref("excluded.email") })),
    )
    .returning(["id"])
    .executeTakeFirstOrThrow()

  if (role === null) return user

  await db
    .insertInto("ResourcePermission")
    .values({
      userId: user.id,
      siteId: SEED_SITE_ID,
      role,
      resourceId: null,
    })
    .onConflict((oc) =>
      oc
        .columns(["userId", "siteId", "resourceId", "role"])
        .doUpdateSet({ deletedAt: null }),
    )
    .execute()

  return user
}

export const seedRolesForE2E = async () => {
  await ensureUserWithRole(TEST_EMAILS.admin, RoleType.Admin)
  await ensureUserWithRole(TEST_EMAILS.nomember, null)
  // editor + publisher are seeded by prisma/seed.ts; ensure they're still active
  await ensureUserWithRole(TEST_EMAILS.editor, RoleType.Editor)
  await ensureUserWithRole(TEST_EMAILS.publisher, RoleType.Publisher)
}
```

> **Engineer note:** The `ResourcePermission` unique constraint may not exactly match `(userId, siteId, resourceId, role)`. Before running, verify with `\d "ResourcePermission"` in psql. If the constraint differs, change `oc.columns([...])` to match. If no suitable constraint exists, replace the `onConflict` chain with: `SELECT` first, `INSERT` only if missing.

- [ ] **Step 2: Verify unique constraint matches**

Run: `docker exec studio-postgres-1 psql -U root -d test -c '\d "ResourcePermission"'`

Read the index list at the bottom of the output. If you see a UNIQUE index covering `(userId, siteId, resourceId, role)` (deletedAt may or may not be included), the `onConflict` clause is correct. If columns differ, update `oc.columns([...])` accordingly.

- [ ] **Step 3: Commit**

```bash
git add apps/studio/tests/e2e/fixtures/seed.ts
git commit -m "test(e2e): add idempotent seed helper for e2e roles (admin, nomember)"
```

---

### Task 4: Write the global-setup script

**Files:**
- Create: `apps/studio/tests/e2e/global-setup.ts`

- [ ] **Step 1: Write global-setup**

```typescript
import type { FullConfig } from "@playwright/test"
import { chromium } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"

import { ROLES, storageStateFor, TEST_EMAILS } from "./fixtures/auth"
import { seedRolesForE2E } from "./fixtures/seed"
import { LoginPage } from "./fixtures/login"

const setSingpassUuidFor = async (email: string, uuid: string) => {
  await db
    .updateTable("User")
    .set({ singpassUuid: uuid, name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()
}

const signInOnce = async (role: keyof typeof TEST_EMAILS, baseURL: string) => {
  const email = TEST_EMAILS[role]
  const uuid = crypto.randomUUID()
  await setSingpassUuidFor(email, uuid)

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ baseURL })
  const page = await ctx.newPage()
  const loginPage = new LoginPage(page)

  await page.goto("/sign-in")
  await loginPage.fillEmail(email)
  await page.getByText("Enter OTP").waitFor()
  await loginPage.fillToken(email)
  await page.getByRole("button", { name: "Sign in" }).click()
  await loginPage.mockpassLoginWith(uuid as `${string}-${string}-${string}-${string}-${string}`)
  await page.waitForURL(baseURL + "/")

  await ctx.storageState({ path: storageStateFor(role) })
  await browser.close()
}

const globalSetup = async (config: FullConfig) => {
  const baseURL =
    config.projects[0]?.use.baseURL ?? "http://127.0.0.1:3000"

  await seedRolesForE2E()

  for (const role of ROLES) {
    await signInOnce(role, baseURL)
  }
}

export default globalSetup
```

> **Engineer note:** Why serial, not parallel? The OTP table uses fingerprint-keyed rows; concurrent logins for different users are fine, but we keep this serial to make failures readable. Total cost is ~4 × 4s = 16s, paid once per test run. If this becomes a bottleneck, parallelize with `Promise.all(ROLES.map(...))`.

- [ ] **Step 2: Commit**

```bash
git add apps/studio/tests/e2e/global-setup.ts
git commit -m "test(e2e): add global-setup that signs in each role once and saves storage state"
```

---

### Task 5: Wire global-setup into Playwright config

**Files:**
- Modify: `apps/studio/playwright.config.ts`

- [ ] **Step 1: Read current config**

```bash
cat apps/studio/playwright.config.ts
```

Expected current contents:

```typescript
import { defineConfig, devices } from "@playwright/test"

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000"

const opts = {
  headless: !!process.env.CI || !!process.env.PLAYWRIGHT_HEADLESS,
}

export default defineConfig({
  reporter: process.env.CI ? "github" : "list",
  testDir: "./tests/e2e",
  timeout: 35e3,
  projects: [
    {
      name: "e2e",
      outputDir: "./tests/e2e/test-results",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: baseUrl,
        headless: opts.headless,
        video: "on",
      },
    },
  ],
})
```

- [ ] **Step 2: Add globalSetup**

Replace the `defineConfig({...})` body so it becomes:

```typescript
export default defineConfig({
  reporter: process.env.CI ? "github" : "list",
  testDir: "./tests/e2e",
  timeout: 35e3,
  globalSetup: require.resolve("./tests/e2e/global-setup.ts"),
  projects: [
    {
      name: "e2e",
      outputDir: "./tests/e2e/test-results",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: baseUrl,
        headless: opts.headless,
        video: "on",
      },
    },
  ],
})
```

> **Engineer note:** We do **not** set a default `storageState` at the project level. Each test opts in via `test.use({ storageState })`. This keeps the existing `singpass.test.ts` and `smoke.test.ts` (which expect a fresh, unauthenticated context) untouched.

- [ ] **Step 3: Run existing tests to confirm nothing broke**

Run: `cd apps/studio && pnpm dev:e2e`
Expected: `3 passed, 4 skipped` (same as before, plus an extra ~16s for global-setup signing in roles).

- [ ] **Step 4: Commit**

```bash
git add apps/studio/playwright.config.ts
git commit -m "test(e2e): register global-setup for role-based auth fixtures"
```

---

### Task 6: Build the Site page object

**Files:**
- Create: `apps/studio/tests/e2e/fixtures/site.po.ts`

- [ ] **Step 1: Write the Page Object**

```typescript
import type { Page } from "@playwright/test"

export type SettingsSection =
  | "agency"
  | "colours"
  | "footer"
  | "integrations"
  | "logo"
  | "navbar"
  | "notification"
  | "redirects"

export class SitePO {
  constructor(private readonly page: Page) {}

  async openSite(siteName: string) {
    await this.page.goto("/")
    await this.page.getByRole("link", { name: siteName }).click()
    await this.page.waitForURL(/\/sites\/\d+$/)
  }

  async openSettings() {
    await this.page.getByRole("link", { name: "Settings" }).click()
    await this.page.waitForURL(/\/sites\/\d+\/settings\//)
  }

  async openSettingsSection(section: SettingsSection) {
    // Settings landing redirects to /agency. To reach other sections we
    // navigate via the settings side-nav (label === section name, title-cased).
    const label = SETTINGS_SECTION_LABELS[section]
    await this.page.getByRole("link", { name: label }).click()
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  saveButton() {
    return this.page.getByRole("button", { name: "Save" })
  }

  async expectSuccessToast() {
    await this.page
      .getByText(/saved|updated/i)
      .first()
      .waitFor({ state: "visible" })
  }
}

const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  agency: "Name and agency",
  colours: "Colours",
  footer: "Footer",
  integrations: "Integrations",
  logo: "Logo",
  navbar: "Navbar",
  notification: "Notification",
  redirects: "Redirects",
}
```

> **Engineer note:** Before relying on `openSettingsSection`, run the dev server and click through `/sites/1/settings/...` manually to verify the side-nav uses the exact labels in `SETTINGS_SECTION_LABELS`. If any label differs, update the map. The labels come from `apps/studio/src/features/settings/SettingsSidenav/` (search there first).

- [ ] **Step 2: Verify section labels match the actual sidenav**

Run: `grep -rnE '"(Name and agency|Colours|Footer|Integrations|Logo|Navbar|Notification|Redirects)"' apps/studio/src/features/settings/`

Expected: each label appears at least once (likely in `SettingsSidenav/SidenavItems.tsx` or similar). Fix the map for any mismatches before continuing.

- [ ] **Step 3: Commit**

```bash
git add apps/studio/tests/e2e/fixtures/site.po.ts
git commit -m "test(e2e): add SitePO page object for navigation + settings sections"
```

---

### Task 7: E2E — site list shows only sites the user has permission for

This mirrors `site.router > list > "should only include sites that the user has any role permission for"` (`site.router.test.ts:182`).

**Files:**
- Create: `apps/studio/tests/e2e/site/list.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { expect, test } from "@playwright/test"
import { storageStateFor } from "../fixtures/auth"

test.describe("site list", () => {
  test("editor sees the Isomer seed site", async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: storageStateFor("editor"),
    })
    const page = await ctx.newPage()
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Your sites" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Isomer" })).toBeVisible()
    await ctx.close()
  })

  test("user with no permissions sees empty state", async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: storageStateFor("nomember"),
    })
    const page = await ctx.newPage()
    await page.goto("/")

    await expect(
      page.getByText("You don't have access to any sites yet."),
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Isomer" }),
    ).not.toBeVisible()
    await ctx.close()
  })
})
```

- [ ] **Step 2: Run it**

Run: `cd apps/studio && pnpm dev:e2e`
Expected: `+2 passed` for the new file. Verify both pass.

- [ ] **Step 3: Commit**

```bash
git add apps/studio/tests/e2e/site/list.test.ts
git commit -m "test(e2e): cover site list permission filter (editor + nomember)"
```

---

### Task 8: E2E — settings agency happy path (admin can edit + save)

This mirrors `site.router > updateSiteConfig > "should update the site config if the user is a site admin"` (`site.router.test.ts:499`).

**Files:**
- Create: `apps/studio/tests/e2e/site/settings-agency.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { expect, test } from "@playwright/test"
import { db } from "~/server/modules/database"
import { storageStateFor } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"
import { SitePO } from "../fixtures/site.po"

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  // Reset siteName on the seed site so the test is idempotent.
  await db
    .updateTable("Site")
    .set({ name: "Isomer" })
    .where("id", "=", getSeedSiteId())
    .execute()
})

test("admin can update site name on the agency settings page", async ({
  page,
}) => {
  const site = new SitePO(page)
  await site.openSite("Isomer")
  await site.openSettings()

  const nameField = page.getByLabel("Site name")
  await expect(nameField).toBeVisible()
  await nameField.fill("Isomer (renamed)")

  await site.saveButton().click()
  await site.expectSuccessToast()

  // Hard-assert persistence: reload and verify the value sticks.
  await page.reload()
  await expect(page.getByLabel("Site name")).toHaveValue("Isomer (renamed)")
})
```

> **Engineer note:** `getByLabel("Site name")` assumes the agency form labels its input "Site name". If `apps/studio/src/pages/sites/[siteId]/settings/agency.tsx` uses a different label (e.g. "Name"), grep `apps/studio/packages/components/src/...AgencySettingsSchema` to find the actual label and update the locator. Don't paper over a mismatch with a brittle CSS selector.

- [ ] **Step 2: Run it**

Run: `cd apps/studio && pnpm dev:e2e`
Expected: `+1 passed`.

- [ ] **Step 3: Commit**

```bash
git add apps/studio/tests/e2e/site/settings-agency.test.ts
git commit -m "test(e2e): admin can update site name via agency settings"
```

---

### Task 9: E2E — settings agency permission gate (publisher can't save)

This mirrors `site.router > updateSiteConfig > "should throw 403 if the user has publisher access to the site"` (`site.router.test.ts:446`).

**Files:**
- Modify: `apps/studio/tests/e2e/site/settings-agency.test.ts`

- [ ] **Step 1: Append a second test block**

Add to the existing file, after the admin test:

```typescript
test.describe("publisher", () => {
  test.use({ storageState: storageStateFor("publisher") })

  test("publisher sees agency settings but cannot save changes", async ({
    page,
  }) => {
    const site = new SitePO(page)
    await site.openSite("Isomer")
    await site.openSettings()

    const nameField = page.getByLabel("Site name")
    await expect(nameField).toBeVisible()

    // The form is either read-only for publisher OR the Save button is disabled.
    // Whichever the UI does, the publisher must not be able to commit a change.
    const save = site.saveButton()
    const isDisabled = await save.isDisabled()
    const isReadOnly = await nameField.isEditable().then((e) => !e)
    expect(isDisabled || isReadOnly).toBe(true)
  })
})
```

> **Engineer note:** If neither condition holds (publisher *can* type and click save, but the API returns 403), capture the toast: `await expect(page.getByText(/permission|forbidden/i)).toBeVisible()`. Investigate the UI before adjusting the test — the integration test (`site.router.test.ts:446`) asserts the *server* rejects; the e2e should assert the *user-visible* outcome, whatever that is.

- [ ] **Step 2: Run it**

Run: `cd apps/studio && pnpm dev:e2e`
Expected: `+1 passed` (test file now has 2 passing tests).

- [ ] **Step 3: Commit**

```bash
git add apps/studio/tests/e2e/site/settings-agency.test.ts
git commit -m "test(e2e): publisher cannot save changes on agency settings"
```

---

### Task 10: E2E — settings notification add/remove

This mirrors three integration scenarios: `setNotification > "should save changes"` (`site.router.test.ts:1661`), `"should add the site notification"` (`site.router.test.ts:1716`), `"should remove the site notification"` (`site.router.test.ts:1747`).

**Files:**
- Create: `apps/studio/tests/e2e/site/settings-notification.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { expect, test } from "@playwright/test"
import { db } from "~/server/modules/database"
import { storageStateFor } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"
import { SitePO } from "../fixtures/site.po"

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  await db
    .updateTable("Notification")
    .where("siteId", "=", getSeedSiteId())
    .set({ content: null, enabled: false })
    .execute()
    .catch(() => {
      // table or row may not exist yet on a clean run — that's fine
    })
})

test("admin can add, edit, and remove a site notification", async ({
  page,
}) => {
  const site = new SitePO(page)
  await site.openSite("Isomer")
  await site.openSettings()
  await site.openSettingsSection("notification")

  const enable = page.getByRole("switch", { name: /enable notification/i })
  await enable.click()

  const contentField = page.getByRole("textbox", { name: /notification/i }).first()
  await contentField.fill("Test e2e notification banner")

  await site.saveButton().click()
  await site.expectSuccessToast()

  // Reload and verify the value persisted.
  await page.reload()
  await expect(contentField).toHaveValue("Test e2e notification banner")

  // Remove: toggle off + save.
  await enable.click()
  await site.saveButton().click()
  await site.expectSuccessToast()

  await page.reload()
  await expect(enable).not.toBeChecked()
})
```

> **Engineer note:** The notification schema may store content as JSON (prose/text). Test against the *user-typed* string in the form input, not the persisted JSON shape — UI tests are concerned with what the user sees and types, not the storage format.
>
> If `Notification` table doesn't exist or column names differ, replace the `beforeEach` cleanup with a UI-level reset: log in, navigate to notification settings, toggle off + save.

- [ ] **Step 2: Run it**

Run: `cd apps/studio && pnpm dev:e2e`
Expected: `+1 passed`.

- [ ] **Step 3: Commit**

```bash
git add apps/studio/tests/e2e/site/settings-notification.test.ts
git commit -m "test(e2e): admin can add/edit/remove site notification"
```

---

### Task 11: Delete the superseded site-settings.test.ts

The original `site-settings.test.ts` covered: login → click site → open settings → assert agency heading. That's now covered (more thoroughly) by `site/list.test.ts` and `site/settings-agency.test.ts`.

**Files:**
- Delete: `apps/studio/tests/e2e/site-settings.test.ts`

- [ ] **Step 1: Verify the new tests subsume the old one**

The old test asserts: (a) "Your sites" heading visible, (b) "Isomer" link visible + clickable, (c) Settings link reaches `/settings/agency`, (d) "Name and agency" heading visible.

Checks:
- (a) + (b) → covered by `site/list.test.ts` first test.
- (c) → covered by `site/settings-agency.test.ts` `SitePO.openSettings()` (which `waitForURL(/\/settings\//)`) and the first Task 8 test which reaches the agency form.
- (d) → covered transitively by the agency form being interactable in Task 8.

- [ ] **Step 2: Delete and run suite**

Run: `git rm apps/studio/tests/e2e/site-settings.test.ts && cd apps/studio && pnpm dev:e2e`
Expected: previous-test passes - 1, new-test passes ≥ +5. Net e2e coverage strictly greater.

- [ ] **Step 3: Commit**

```bash
git commit -m "test(e2e): remove site-settings.test.ts (superseded by site/ suite)"
```

---

### Task 12: Document the pattern for other modules

**Files:**
- Create: `apps/studio/tests/e2e/README.md`

- [ ] **Step 1: Write README**

```markdown
# E2E Tests

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

## Why storage-state, not per-test login

OTP + Mockpass adds ~4s per login. Without storage state, a 10-test suite spends 40s on auth alone. Global-setup signs in each role once at startup; tests reuse cookies via `test.use({ storageState: storageStateFor("admin") })`.

## Why we still keep integration tests

E2E covers user-visible behavior. Integration tests cover server-side correctness: audit log shape, GTM ID validation, role-boundary 401/403/404 codes, SearchSG side effects. We need both layers. Translating every integration scenario to e2e would triple CI time without adding meaningful signal.
```

- [ ] **Step 2: Commit**

```bash
git add apps/studio/tests/e2e/README.md
git commit -m "docs(e2e): explain test structure and per-module migration pattern"
```

---

## After this plan: next modules to apply the pattern

Order suggested (most user-facing first):

1. **page module** (`page.router.test.ts`): page create / edit / publish via UI. Highest user impact.
2. **resource module** (`resource.router.test.ts`): folder, collection, link creation in the site tree.
3. **user module** (`user.router.test.ts`): collaborator invite + role change UI.
4. **asset module** (`asset.router.test.ts`): file upload in the editor.
5. **collection module** (`collection.router.test.ts`).
6. **folder module** (`folder.router.test.ts`).
7. **me module** (`me.router.test.ts`).

For each: spawn a new plan modeled on this one, replacing the `site/` directory layout and PO with the module's equivalent. The fixtures (`auth.ts`, `seed.ts`, `global-setup.ts`) and storage state mechanism do not need to change — only the per-module page objects and test files.

**Skip translating to e2e:**
- `auth/email`, `auth/singpass`: already covered by the (currently-skipped) `singpass.test.ts`. Un-skipping those is a separate cleanup, not this migration.
- `audit.service`, `permissions.service`, `inactiveUsers.service`, `searchsg.service`: no direct UI surface.
- `gazette.router`, `webhook.router`, `whitelist.router`: internal admin surfaces; e2e coverage low-value relative to integration coverage.
- `cron/jobs/*`: background, no UI.
- `packages/pgboss`: infrastructure, no UI.

---

## Self-Review Checklist (run before handing off)

1. **Spec coverage**: Every integration `describe` in `site.router.test.ts` with a user-facing surface has at least one corresponding e2e task (Tasks 7–10). Audit-log, GTM-validation, and edge-case scenarios are intentionally not translated — documented in Task 12's README.
2. **Placeholder scan**: No "TBD" / "implement later" / "similar to Task N" patterns. Code blocks are complete and self-contained per task.
3. **Type consistency**: `SitePO`, `Role`, `TEST_EMAILS`, `storageStateFor`, `getSeedSiteId` are defined once (Tasks 2, 3, 6) and used unchanged in Tasks 7–10. `RoleType` references match Prisma's generated enum.
4. **Migration realism**: The plan rests on three assumptions that could break — flagged in engineer notes: (a) `ResourcePermission` unique constraint shape (Task 3 step 2), (b) settings sidenav labels (Task 6 step 2), (c) "Site name" form label (Task 8). Each has a verification step before the implementation step.
