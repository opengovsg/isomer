import { expect, test, type Page } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"

const UNIQUE_TITLE = () => `E2E Test Page ${crypto.randomUUID().slice(0, 8)}`

// The welcome modal blocks the dashboard until the user has a name + phone, so
// set them before the create flow is reachable.
const dismissWelcomeModal = (email: string) =>
  db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()

// Drives the full menu → modal → form wizard and waits for the post-create
// redirect. `startUrl` is the dashboard the flow begins on — the site root or a
// folder page; the wizard, labels and redirect are identical for both.
const createPageViaWizard = async (
  page: Page,
  { startUrl, title }: { startUrl: string; title: string },
) => {
  await page.goto(startUrl)

  await page.getByRole("button", { name: "Create new..." }).click()
  await page.getByRole("menuitem", { name: "Page" }).click()

  // Layout screen: keep the default layout and proceed.
  await page.getByRole("button", { name: "Next: Page title and URL" }).click()

  // Details screen: title auto-fills the URL.
  await page.getByLabel("Page title").fill(title)
  await page.getByRole("button", { name: "Start editing" }).click()

  // Router pushes to /sites/{siteId}/pages/{pageId}.
  await page.waitForURL(new RegExp(`/sites/${getSeedSiteId()}/pages/\\d+$`))
}

// A folder isn't part of the seed, so create one per-test to nest pages under.
// Returns the folder id (BigInt columns are serialized as strings).
const createSeedFolder = () =>
  db
    .insertInto("Resource")
    .values({
      permalink: `e2e-test-folder-${crypto.randomUUID().slice(0, 8)}`,
      siteId: getSeedSiteId(),
      parentId: null,
      title: "E2E Test Folder",
      draftBlobId: null,
      state: ResourceState.Draft,
      type: ResourceType.Folder,
      publishedVersionId: null,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

// Deleting the folder cascades to its child pages (Resource.parent is
// onDelete: Cascade), so this also clears anything the wizard created under it.
const deleteFolder = (folderId: string) =>
  db.deleteFrom("Resource").where("id", "=", folderId).execute()

test.describe("admin", () => {
  test.use({ storageState: storageStateFor("admin") })

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    // Remove any pages whose title starts with "E2E Test Page" so subsequent
    // runs don't accumulate state. permalink uniqueness is enforced per-site,
    // and the create flow auto-derives permalink from title — using a unique
    // title per run side-steps conflicts, but we still clean up afterwards.
    await db
      .deleteFrom("Resource")
      .where("siteId", "=", getSeedSiteId())
      .where("title", "like", "E2E Test Page %")
      .execute()
  })

  test("admin can create a new page via the wizard", async ({ page }) => {
    const title = UNIQUE_TITLE()
    await createPageViaWizard(page, {
      startUrl: `/sites/${getSeedSiteId()}`,
      title,
    })

    // Verify in DB the page was created at the root with Draft state.
    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", getSeedSiteId())
      .where("title", "=", title)
      .select(["id", "state", "type", "parentId"])
      .executeTakeFirst()
    expect(created).toBeTruthy()
    expect(created?.state).toBe("Draft")
    expect(created?.type).toBe("Page")
    expect(created?.parentId).toBeNull()
  })
})

test.describe("publisher", () => {
  test.use({ storageState: storageStateFor("publisher") })

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.publisher)
  })

  test("publisher does not see the Create new button", async ({ page }) => {
    await page.goto(`/sites/${getSeedSiteId()}`)
    // Site content table is visible (page rendered) but the create menu is
    // gated by `<Can do="create" on={{ parentId: null }}>` and absent for
    // publishers — base permissions grant them read/update at the root, not
    // create.
    await expect(
      page.getByRole("button", { name: "Create new..." }),
    ).not.toBeVisible()
  })
})

test.describe("editor", () => {
  test.use({ storageState: storageStateFor("editor") })

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.editor)
  })

  test("editor does not see the Create new button", async ({ page }) => {
    await page.goto(`/sites/${getSeedSiteId()}`)
    // Editors, like publishers, only get read/update at the root, so the
    // `<Can do="create" on={{ parentId: null }}>`-gated menu is absent.
    await expect(
      page.getByRole("button", { name: "Create new..." }),
    ).not.toBeVisible()
  })
})

// The permission model inside a folder differs from the root: base permissions
// grant create on resources with a non-null parent to every role, and the
// folder page does not gate the "Create new..." menu behind `<Can>`. So a
// publisher — who cannot create at the root — can create pages inside a folder.
test.describe("admin — create page in a subfolder", () => {
  test.use({ storageState: storageStateFor("admin") })

  let folderId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    folderId = (await createSeedFolder()).id
  })

  test.afterEach(async () => {
    await deleteFolder(folderId)
  })

  test("admin can create a new page inside a folder", async ({ page }) => {
    const title = UNIQUE_TITLE()
    await createPageViaWizard(page, {
      startUrl: `/sites/${getSeedSiteId()}/folders/${folderId}`,
      title,
    })

    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", getSeedSiteId())
      .where("title", "=", title)
      .select(["id", "state", "parentId"])
      .executeTakeFirst()
    expect(created).toBeTruthy()
    expect(created?.state).toBe("Draft")
    expect(created?.parentId).toBe(folderId)
  })
})

test.describe("publisher — create page in a subfolder", () => {
  test.use({ storageState: storageStateFor("publisher") })

  let folderId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.publisher)
    folderId = (await createSeedFolder()).id
  })

  test.afterEach(async () => {
    await deleteFolder(folderId)
  })

  test("publisher can create a new page inside a folder", async ({ page }) => {
    const title = UNIQUE_TITLE()
    await createPageViaWizard(page, {
      startUrl: `/sites/${getSeedSiteId()}/folders/${folderId}`,
      title,
    })

    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", getSeedSiteId())
      .where("title", "=", title)
      .select(["id", "state", "parentId"])
      .executeTakeFirst()
    expect(created).toBeTruthy()
    expect(created?.state).toBe("Draft")
    expect(created?.parentId).toBe(folderId)
  })
})

test.describe("editor — create page in a subfolder", () => {
  test.use({ storageState: storageStateFor("editor") })

  let folderId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.editor)
    folderId = (await createSeedFolder()).id
  })

  test.afterEach(async () => {
    await deleteFolder(folderId)
  })

  test("editor can create a new page inside a folder", async ({ page }) => {
    const title = UNIQUE_TITLE()
    await createPageViaWizard(page, {
      startUrl: `/sites/${getSeedSiteId()}/folders/${folderId}`,
      title,
    })

    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", getSeedSiteId())
      .where("title", "=", title)
      .select(["id", "state", "parentId"])
      .executeTakeFirst()
    expect(created).toBeTruthy()
    expect(created?.state).toBe("Draft")
    expect(created?.parentId).toBe(folderId)
  })
})
