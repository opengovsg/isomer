import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, storageStateFor } from "../fixtures/auth"
import { createPageViaWizard } from "../fixtures/helpers"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () => `E2E Test Page ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    admin: true,
    editor: true,
    publisher: true,
  })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

const createSeedFolder = () =>
  db
    .insertInto("Resource")
    .values({
      permalink: `e2e-test-folder-${crypto.randomUUID().slice(0, 8)}`,
      siteId,
      parentId: null,
      title: "E2E Test Folder",
      draftBlobId: null,
      state: ResourceState.Draft,
      type: ResourceType.Folder,
      publishedVersionId: null,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

const deleteFolder = (folderId: string) =>
  db.deleteFrom("Resource").where("id", "=", folderId).execute()

test.describe("admin", () => {
  test.use({ storageState: storageStateFor("admin") })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await db
      .deleteFrom("Resource")
      .where("siteId", "=", siteId)
      .where("title", "like", "E2E Test Page %")
      .execute()
  })

  test("admin can create a new page via the wizard", async ({ page }) => {
    const title = UNIQUE_TITLE()
    await createPageViaWizard(page, {
      startUrl: `/sites/${siteId}`,
      title,
      siteId,
    })

    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
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
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher does not see the Create new button", async ({ page }) => {
    await page.goto(`/sites/${siteId}`)
    await expect(
      page.getByRole("button", { name: "Create new..." }),
    ).not.toBeVisible()
  })
})

test.describe("editor", () => {
  test.use({ storageState: storageStateFor("editor") })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor does not see the Create new button", async ({ page }) => {
    await page.goto(`/sites/${siteId}`)
    await expect(
      page.getByRole("button", { name: "Create new..." }),
    ).not.toBeVisible()
  })
})

test.describe("admin — create page in a subfolder", () => {
  test.use({ storageState: storageStateFor("admin") })

  let folderId: string

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    folderId = (await createSeedFolder()).id
  })

  test.afterEach(async () => {
    await deleteFolder(folderId)
  })

  test("admin can create a new page inside a folder", async ({ page }) => {
    const title = UNIQUE_TITLE()
    await createPageViaWizard(page, {
      startUrl: `/sites/${siteId}/folders/${folderId}`,
      title,
      siteId,
    })

    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
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
    await ensureUserOnboarded(TEST_EMAILS.publisher)
    folderId = (await createSeedFolder()).id
  })

  test.afterEach(async () => {
    await deleteFolder(folderId)
  })

  test("publisher can create a new page inside a folder", async ({ page }) => {
    const title = UNIQUE_TITLE()
    await createPageViaWizard(page, {
      startUrl: `/sites/${siteId}/folders/${folderId}`,
      title,
      siteId,
    })

    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
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
    await ensureUserOnboarded(TEST_EMAILS.editor)
    folderId = (await createSeedFolder()).id
  })

  test.afterEach(async () => {
    await deleteFolder(folderId)
  })

  test("editor can create a new page inside a folder", async ({ page }) => {
    const title = UNIQUE_TITLE()
    await createPageViaWizard(page, {
      startUrl: `/sites/${siteId}/folders/${folderId}`,
      title,
      siteId,
    })

    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
      .where("title", "=", title)
      .select(["id", "state", "parentId"])
      .executeTakeFirst()
    expect(created).toBeTruthy()
    expect(created?.state).toBe("Draft")
    expect(created?.parentId).toBe(folderId)
  })
})
