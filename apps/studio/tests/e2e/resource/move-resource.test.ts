import { test } from "@playwright/test"
import crypto from "crypto"
import { normalizeRedirectSource } from "~/schemas/redirect/utils"
import { getReferenceLink } from "~/utils/link"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import {
  expectRedirectDestination,
  expectResourceParentId,
  seedFolder,
  seedFolderWithPage,
  seedRootCollection,
  seedRootPage,
  seedTwoCollections,
} from "../fixtures/page-seed"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded, getE2EUserId } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can move a page into a folder", async ({ page }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const pageTitle = `Move Page ${suffix}`
    const folderTitle = `Move Dest Folder ${suffix}`
    const { page: seededPage } = await seedRootPage({ siteId, pageTitle })
    const { folder } = await seedFolder({ siteId, folderTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(folderTitle)
    await dashboard.confirmMove()

    // Assert
    await expectResourceParentId(seededPage.id).toBe(folder.id)
    await dashboard.gotoFolder(siteId, folder.id)
    await dashboard.expectResourceLinkVisible(pageTitle)
    await dashboard.gotoSite(siteId)
    await dashboard.expectResourceLinkHidden(pageTitle)
  })

  test("admin can move a folder into another folder", async ({ page }) => {
    // Arrange
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

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(sourceTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(destTitle)
    await dashboard.confirmMove()

    // Assert
    await expectResourceParentId(sourceFolder.id).toBe(destFolder.id)
    await dashboard.gotoFolder(siteId, destFolder.id)
    await dashboard.expectResourceLinkVisible(sourceTitle)
  })

  test("admin can move a collection into a folder", async ({ page }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const collectionTitle = `Move Collection ${suffix}`
    const folderTitle = `Move Collection Folder ${suffix}`
    const { collection } = await seedRootCollection({
      siteId,
      collectionTitle,
    })
    const { folder } = await seedFolder({ siteId, folderTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(collectionTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(folderTitle)
    await dashboard.confirmMove()

    // Assert
    await expectResourceParentId(collection.id).toBe(folder.id)
    await dashboard.gotoFolder(siteId, folder.id)
    await dashboard.expectResourceLinkVisible(collectionTitle)
    await dashboard.gotoSite(siteId)
    await dashboard.expectResourceLinkHidden(collectionTitle)
  })

  test("admin can move a collection page into another collection", async ({
    page,
  }) => {
    // Arrange
    const { sourceCollection, destCollection, collectionPage } =
      await seedTwoCollections({
        siteId,
        collectionPageTitle: `Move Col Page ${crypto.randomUUID().slice(0, 8)}`,
        sourceCollectionTitle: `Move Src Col ${crypto.randomUUID().slice(0, 8)}`,
        destCollectionTitle: `Move Dest Col ${crypto.randomUUID().slice(0, 8)}`,
      })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoCollection(siteId, sourceCollection.id)
    await dashboard.openCollectionResourceMenu(collectionPage.title)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(destCollection.title)
    await dashboard.confirmMove()

    // Assert
    await expectResourceParentId(collectionPage.id).toBe(destCollection.id)
    await dashboard.gotoCollection(siteId, destCollection.id)
    await dashboard.expectResourceLinkVisible(collectionPage.title)
  })

  test("admin can cancel move and keep the resource parent unchanged", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const pageTitle = `Cancel Move Page ${suffix}`
    const folderTitle = `Cancel Move Folder ${suffix}`
    const { page: seededPage } = await seedRootPage({ siteId, pageTitle })
    await seedFolder({ siteId, folderTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(folderTitle)
    await dashboard.cancelMove()

    // Assert
    await expectResourceParentId(seededPage.id).toBeNull()
    await dashboard.expectResourceLinkVisible(pageTitle)
  })

  test("admin can move a published page and create a redirect from the old URL", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const folderTitle = `Move Redirect Folder ${suffix}`
    const pageTitle = `Move Redirect Page ${suffix}`
    const publisherId = await getE2EUserId(TEST_EMAILS.publisher)
    const { folder: sourceFolder, page: seededPage } = await seedFolderWithPage(
      {
        siteId,
        state: ResourceState.Published,
        userId: publisherId,
        pageTitle,
      },
    )
    const { folder: destFolder } = await seedFolder({ siteId, folderTitle })
    const oldSource = normalizeRedirectSource(
      `/${sourceFolder.permalink}/${seededPage.permalink}`,
    )

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, sourceFolder.id)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(folderTitle)
    await dashboard.confirmMove()

    // Assert
    await expectResourceParentId(seededPage.id).toBe(destFolder.id)
    await expectRedirectDestination(siteId, oldSource).toBe(
      getReferenceLink({ siteId: String(siteId), resourceId: seededPage.id }),
    )
  })

  test("admin can move a published page without creating a redirect", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const folderTitle = `Move No Redirect Folder ${suffix}`
    const pageTitle = `Move No Redirect Page ${suffix}`
    const publisherId = await getE2EUserId(TEST_EMAILS.publisher)
    const { folder: sourceFolder, page: seededPage } = await seedFolderWithPage(
      {
        siteId,
        state: ResourceState.Published,
        userId: publisherId,
        pageTitle,
      },
    )
    const { folder: destFolder } = await seedFolder({ siteId, folderTitle })
    const oldSource = normalizeRedirectSource(
      `/${sourceFolder.permalink}/${seededPage.permalink}`,
    )

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, sourceFolder.id)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.clickMove()
    await dashboard.selectMoveDestination(folderTitle)
    await dashboard.uncheckCreateRedirectOnMove()
    await dashboard.confirmMove()

    // Assert
    await expectResourceParentId(seededPage.id).toBe(destFolder.id)
    await expectRedirectDestination(siteId, oldSource).toBeNull()
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor cannot move a root-level page when the menu disables move", async ({
    page,
  }) => {
    // Arrange
    const pageTitle = `Root Move Gate ${crypto.randomUUID().slice(0, 8)}`
    await seedRootPage({ siteId, pageTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(pageTitle)

    // Assert
    await dashboard.expectMoveMenuDisabled()
  })

  test("editor cannot move a root-level folder when the menu disables move", async ({
    page,
  }) => {
    // Arrange
    const folderTitle = `Root Folder Move Gate ${crypto.randomUUID().slice(0, 8)}`
    const { folder } = await seedFolder({ siteId, folderTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(folderTitle)

    // Assert
    await dashboard.expectMoveMenuDisabled()
    await expectResourceParentId(folder.id).toBeNull()
  })

  test("editor cannot move a root-level collection when the menu disables move", async ({
    page,
  }) => {
    // Arrange
    const collectionTitle = `Root Collection Move Gate ${crypto.randomUUID().slice(0, 8)}`
    const { collection } = await seedRootCollection({
      siteId,
      collectionTitle,
    })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(collectionTitle)

    // Assert
    await dashboard.expectMoveMenuDisabled()
    await expectResourceParentId(collection.id).toBeNull()
  })
})
