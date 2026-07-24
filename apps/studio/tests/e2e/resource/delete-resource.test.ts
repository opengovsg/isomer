import { test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import {
  expectResourceAbsent,
  expectResourcePresent,
  seedCollectionWithLink,
  seedCollectionWithPage,
  seedFolderWithChildPage,
  seedFolderWithPage,
  seedRootCollection,
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

    await expectResourceAbsent(seededPage.id).toBeNull()
    await dashboard.expectResourceLinkHidden(pageTitle)
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
    await dashboard.confirmDeleteResource("folder", { title: folderTitle })

    await expectResourceAbsent(folder.id).toBeNull()
    await expectResourceAbsent(childPage.id).toBeNull()
    await dashboard.expectResourceLinkHidden(folderTitle)
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
    await dashboard.confirmDeleteResource("collection", {
      title: collectionTitle,
    })

    await expectResourceAbsent(collection.id).toBeNull()
    await expectResourceAbsent(collectionPage.id).toBeNull()
    await dashboard.expectResourceLinkHidden(collectionTitle)
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

    await expectResourceAbsent(collectionPage.id).toBeNull()
    await expectResourcePresent(collection.id).not.toBeNull()
    await dashboard.expectResourceLinkHidden(pageTitle)
  })

  test("admin can delete a collection link item", async ({ page }) => {
    const linkTitle = `Delete Col Link ${crypto.randomUUID().slice(0, 8)}`
    const { collection, collectionLink } = await seedCollectionWithLink({
      siteId,
      linkTitle,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoCollection(siteId, collection.id)
    await dashboard.openCollectionResourceMenu(linkTitle)
    await dashboard.clickDelete()
    await dashboard.confirmDeleteResource("page", { title: linkTitle })

    await expectResourceAbsent(collectionLink.id).toBeNull()
    await expectResourcePresent(collection.id).not.toBeNull()
    await dashboard.expectResourceLinkHidden(linkTitle)
  })

  test("admin can cancel delete and keep the resource in the DB", async ({
    page,
  }) => {
    const pageTitle = `Cancel Delete ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({ siteId, pageTitle })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(pageTitle)
    await dashboard.clickDelete()
    await dashboard.cancelDeleteResource("page", { title: pageTitle })

    await expectResourcePresent(seededPage.id).not.toBeNull()
    await dashboard.expectResourceLinkVisible(pageTitle)
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

  test("editor cannot delete a root-level folder when the menu hides delete", async ({
    page,
  }) => {
    const folderTitle = `Root Folder Delete Gate ${crypto.randomUUID().slice(0, 8)}`
    const { folder } = await seedFolderWithChildPage({
      siteId,
      folderTitle,
      pageTitle: `Child ${crypto.randomUUID().slice(0, 8)}`,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(folderTitle)
    await dashboard.expectDeleteMenuHidden()
    await expectResourcePresent(folder.id).not.toBeNull()
  })

  test("editor cannot delete a root-level collection when the menu hides delete", async ({
    page,
  }) => {
    const collectionTitle = `Root Collection Delete Gate ${crypto.randomUUID().slice(0, 8)}`
    const { collection } = await seedRootCollection({
      siteId,
      collectionTitle,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(collectionTitle)
    await dashboard.expectDeleteMenuHidden()
    await expectResourcePresent(collection.id).not.toBeNull()
  })
})
