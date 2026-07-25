import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { ResourceType, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { createCollectionViaWizard } from "../fixtures/helpers"
import { deleteCollectionsByTitlePrefix } from "../fixtures/reset"
import {
  getResourceByTitle,
  getResourceByTitleAndType,
} from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () =>
  `E2E Test Collection ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await deleteCollectionsByTitlePrefix(siteId, "E2E Test Collection ")
  })

  test("admin can create a collection via the Create new wizard", async ({
    page,
  }) => {
    const title = UNIQUE_TITLE()

    // Arrange / Act
    await createCollectionViaWizard(page, { siteId, title })

    // Assert
    // NOTE: creating a collection also creates an IndexPage child with the
    // same title, so we must filter by type to find the collection itself.
    const created = await getResourceByTitleAndType({
      siteId,
      title,
      type: ResourceType.Collection,
    })
    expect(created).toBeTruthy()
    expect(created?.type).toBe("Collection")
  })

  test("admin can close the create collection modal without creating a collection", async ({
    page,
  }) => {
    const title = UNIQUE_TITLE()
    const dashboard = new DashboardPO(page)

    // Arrange
    await dashboard.gotoSite(siteId)

    // Act
    await dashboard.openCreateCollectionModal()
    await dashboard.fillCreateCollectionModalTitle(title)
    await dashboard.cancelCreateCollectionModal()

    // Assert
    const created = await getResourceByTitle({ siteId, title })
    expect(created).toBeUndefined()
  })
})
