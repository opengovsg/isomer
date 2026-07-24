import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import {
  seedCollectionWithPage,
  seedFolderWithChildPage,
  seedFolderWithPage,
  seedRootPage,
} from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor],
  })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

const resourceExists = async (resourceId: string) => {
  return db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("id")
    .executeTakeFirst()
}

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can delete a page inside a folder", async ({ page }) => {
    const pageTitle = `Delete Page ${crypto.randomUUID().slice(0, 8)}`
    const { folder, page: seededPage } = await seedFolderWithPage({
      siteId,
      pageTitle,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, folder.id)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.clickDelete()
    await dashboard.confirmDeleteResource("page", { title: pageTitle })

    expect(await resourceExists(seededPage.id)).toBeUndefined()
  })

  test("admin can delete a folder and its child pages", async ({ page }) => {
    const folderTitle = `Delete Folder ${crypto.randomUUID().slice(0, 8)}`
    const { folder, childPage } = await seedFolderWithChildPage({
      siteId,
      folderTitle,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(folderTitle)
    await dashboard.clickDelete()
    await expect(
      page.getByText(
        "All folders and pages under this folder will be deleted. This cannot be undone.",
      ),
    ).toBeVisible()
    await dashboard.confirmDeleteResource("folder", { title: folderTitle })

    expect(await resourceExists(folder.id)).toBeUndefined()
    expect(await resourceExists(childPage.id)).toBeUndefined()
  })

  test("admin can delete a collection and its pages", async ({ page }) => {
    const collectionTitle = `Delete Collection ${crypto.randomUUID().slice(0, 8)}`
    const { collection, collectionPage } = await seedCollectionWithPage({
      siteId,
      collectionTitle,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(collectionTitle)
    await dashboard.clickDelete()
    await expect(
      page.getByText(
        "All pages under this collection will be deleted. This cannot be undone.",
      ),
    ).toBeVisible()
    await dashboard.confirmDeleteResource("collection", {
      title: collectionTitle,
    })

    expect(await resourceExists(collection.id)).toBeUndefined()
    expect(await resourceExists(collectionPage.id)).toBeUndefined()
  })

  test("admin can delete a collection page item", async ({ page }) => {
    const pageTitle = `Delete Col Page ${crypto.randomUUID().slice(0, 8)}`
    const { collection, collectionPage } = await seedCollectionWithPage({
      siteId,
      pageTitle,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoCollection(siteId, collection.id)
    await dashboard.openCollectionResourceMenu(pageTitle)
    await dashboard.clickDelete()
    await dashboard.confirmDeleteResource("page", { title: pageTitle })

    expect(await resourceExists(collectionPage.id)).toBeUndefined()
    expect(await resourceExists(collection.id)).toBeDefined()
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor cannot delete a root-level page when the menu hides delete", async ({
    page,
  }) => {
    const pageTitle = `Root Delete Gate ${crypto.randomUUID().slice(0, 8)}`
    await seedRootPage({ siteId, pageTitle })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.expectDeleteMenuHidden()
  })
})
