import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import {
  seedFolder,
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

    const updated = await db
      .selectFrom("Resource")
      .where("id", "=", seededPage.id)
      .select("parentId")
      .executeTakeFirst()
    expect(updated?.parentId).toBe(folder.id)
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

    const updated = await db
      .selectFrom("Resource")
      .where("id", "=", sourceFolder.id)
      .select("parentId")
      .executeTakeFirst()
    expect(updated?.parentId).toBe(destFolder.id)
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

    const updated = await db
      .selectFrom("Resource")
      .where("id", "=", collectionPage.id)
      .select("parentId")
      .executeTakeFirst()
    expect(updated?.parentId).toBe(destCollection.id)
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
})
