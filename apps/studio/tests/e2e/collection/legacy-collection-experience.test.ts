import { test } from "@playwright/test"
import { IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import {
  enableGrowthBookFeature,
  resetGrowthBookPage,
} from "~e2e/fixtures/network"
import { CollectionPO } from "~e2e/fixtures/po"
import { seedCollection } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number
let indexPageId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
  const { indexPage } = await seedCollection({ siteId })
  indexPageId = indexPage.id
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("feature-disabled collections show the legacy Collection settings experience", async ({
    page,
  }) => {
    const collection = new CollectionPO(page)

    // Arrange
    await enableGrowthBookFeature(
      page,
      IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY,
      false,
    )
    await resetGrowthBookPage(page)

    // Act
    await collection.gotoIndex(siteId, indexPageId)

    // Assert
    await collection.expectCollectionSettingsVisible()
    await collection.expectFiltersHidden()
  })
})
