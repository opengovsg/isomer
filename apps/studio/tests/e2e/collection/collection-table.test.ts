import { test } from "@playwright/test"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { seedCollectionPages } from "~e2e/fixtures/collection"
import { DashboardPO } from "~e2e/fixtures/po"
import { seedCollection } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

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
