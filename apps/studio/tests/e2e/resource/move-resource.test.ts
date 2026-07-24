import { test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import {
  expectPageParentId,
  seedFolder,
  seedNestedFolder,
  seedRootCollection,
  seedRootPage,
  seedTwoCollections,
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

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can move a page into a folder", async ({ page }) => {
    const suffix = crypto.randomUUID().slice(0, 8)
    const pageTitle = `Move Page ${suffix}`
    const folderTitle = `Move Dest Folder ${suffix}`
    const { page: seededPage } = await seedRootPage({ siteId, pageTitle })
    const { folder } = await seedFolder({ siteId, folderTitle })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(folderTitle)
    await dashboard.confirmMove()

    await expectPageParentId(seededPage.id).toBe(folder.id)
    await dashboard.gotoFolder(siteId, folder.id)
    await dashboard.expectResourceLinkVisible(pageTitle)
    await dashboard.gotoSite(siteId)
    await dashboard.expectResourceLinkHidden(pageTitle)
  })

  test("admin can move a folder into another folder", async ({ page }) => {
    const suffix = crypto.randomUUID().slice(0, 8)
    const sourceTitle = `Move Source Folder ${suffix}`
    const destTitle = `Move Target Folder ${suffix}`
    const { folder: sourceFolder } = await seedFolder({
      siteId,
      folderTitle: sourceTitle,
    })
    const { folder: destFolder } = await seedFolder({
      siteId,
      folderTitle: destTitle,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(sourceTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(destTitle)
    await dashboard.confirmMove()

    await expectPageParentId(sourceFolder.id).toBe(destFolder.id)
    await dashboard.gotoFolder(siteId, destFolder.id)
    await dashboard.expectResourceLinkVisible(sourceTitle)
  })

  test("admin can move a nested folder to the site root", async ({ page }) => {
    const suffix = crypto.randomUUID().slice(0, 8)
    const parentTitle = `Move Parent Folder ${suffix}`
    const childTitle = `Move Nested Folder ${suffix}`
    const { childFolder } = await seedNestedFolder({
      siteId,
      parentFolderTitle: parentTitle,
      childFolderTitle: childTitle,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(childTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveToSiteRoot()
    await dashboard.confirmMove()

    await expectPageParentId(childFolder.id).toBeNull()
    await dashboard.gotoSite(siteId)
    await dashboard.expectResourceLinkVisible(childTitle)
  })

  test("admin can move a collection into a folder", async ({ page }) => {
    const suffix = crypto.randomUUID().slice(0, 8)
    const collectionTitle = `Move Collection ${suffix}`
    const folderTitle = `Move Collection Folder ${suffix}`
    const { collection } = await seedRootCollection({
      siteId,
      collectionTitle,
    })
    const { folder } = await seedFolder({ siteId, folderTitle })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(collectionTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(folderTitle)
    await dashboard.confirmMove()

    await expectPageParentId(collection.id).toBe(folder.id)
    await dashboard.gotoFolder(siteId, folder.id)
    await dashboard.expectResourceLinkVisible(collectionTitle)
    await dashboard.gotoSite(siteId)
    await dashboard.expectResourceLinkHidden(collectionTitle)
  })

  test("admin can move a collection page into another collection", async ({
    page,
  }) => {
    const { sourceCollection, destCollection, collectionPage } =
      await seedTwoCollections({
        siteId,
        collectionPageTitle: `Move Col Page ${crypto.randomUUID().slice(0, 8)}`,
        sourceCollectionTitle: `Move Src Col ${crypto.randomUUID().slice(0, 8)}`,
        destCollectionTitle: `Move Dest Col ${crypto.randomUUID().slice(0, 8)}`,
      })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoCollection(siteId, sourceCollection.id)
    await dashboard.openCollectionResourceMenu(collectionPage.title)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(destCollection.title)
    await dashboard.confirmMove()

    await expectPageParentId(collectionPage.id).toBe(destCollection.id)
    await dashboard.gotoCollection(siteId, destCollection.id)
    await dashboard.expectResourceLinkVisible(collectionPage.title)
  })

  test("admin can cancel move and keep the resource parent unchanged", async ({
    page,
  }) => {
    const suffix = crypto.randomUUID().slice(0, 8)
    const pageTitle = `Cancel Move Page ${suffix}`
    const folderTitle = `Cancel Move Folder ${suffix}`
    const { page: seededPage } = await seedRootPage({ siteId, pageTitle })
    await seedFolder({ siteId, folderTitle })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(folderTitle)
    await dashboard.cancelMove()

    await expectPageParentId(seededPage.id).toBeNull()
    await dashboard.expectResourceLinkVisible(pageTitle)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor cannot move a root-level page when the menu hides move", async ({
    page,
  }) => {
    const pageTitle = `Root Move Gate ${crypto.randomUUID().slice(0, 8)}`
    await seedRootPage({ siteId, pageTitle })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.expectMoveMenuHidden()
  })

  test("editor cannot move a root-level folder when the menu hides move", async ({
    page,
  }) => {
    const folderTitle = `Root Folder Move Gate ${crypto.randomUUID().slice(0, 8)}`
    const { folder } = await seedFolder({ siteId, folderTitle })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(folderTitle)
    await dashboard.expectMoveMenuHidden()
    await expectPageParentId(folder.id).toBeNull()
  })

  test("editor cannot move a root-level collection when the menu hides move", async ({
    page,
  }) => {
    const collectionTitle = `Root Collection Move Gate ${crypto.randomUUID().slice(0, 8)}`
    const { collection } = await seedRootCollection({
      siteId,
      collectionTitle,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(collectionTitle)
    await dashboard.expectMoveMenuHidden()
    await expectPageParentId(collection.id).toBeNull()
  })
})
