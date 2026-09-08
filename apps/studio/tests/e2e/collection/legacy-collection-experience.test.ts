import { test } from "@playwright/test"
import { IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { CollectionPO } from "../fixtures/collection.po"
import {
  enableGrowthBookFeature,
  resetGrowthBookPage,
} from "../fixtures/network"
import { seedCollection } from "../fixtures/page-seed"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

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
