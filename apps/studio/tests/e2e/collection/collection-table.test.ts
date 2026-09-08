import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { seedCollectionPages } from "../fixtures/collection"
import { DashboardPO } from "../fixtures/dashboard.po"
import { seedCollection } from "../fixtures/page-seed"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number
let collectionId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
  const { collection } = await seedCollection({ siteId })
  collectionId = collection.id
  await seedCollectionPages({
    siteId,
    collectionId,
    count: 26,
  })
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("collection items can be sorted alphabetically", async ({ page }) => {
    const dashboard = new DashboardPO(page)

    // Arrange
    await dashboard.gotoCollection(siteId, collectionId)
    await dashboard.expectCollectionItemCount(26)

    // Act
    await dashboard.sortCollectionBy("Alphabetical")

    // Assert
    await dashboard.expectCollectionRowVisible("E2E Sort Item 01")
    await dashboard.expectCollectionRowHidden("E2E Sort Item 26")
  })

  test("collection items paginate past the first 25 rows", async ({ page }) => {
    const dashboard = new DashboardPO(page)

    // Arrange
    await dashboard.gotoCollection(siteId, collectionId)
    await dashboard.sortCollectionBy("Alphabetical")
    await dashboard.expectCollectionRowVisible("E2E Sort Item 01")
    await dashboard.expectCollectionRowHidden("E2E Sort Item 26")

    // Act
    await dashboard.goToCollectionTablePage(2)

    // Assert
    await dashboard.expectCollectionRowVisible("E2E Sort Item 26")
    await dashboard.expectCollectionRowHidden("E2E Sort Item 01")
  })
})
