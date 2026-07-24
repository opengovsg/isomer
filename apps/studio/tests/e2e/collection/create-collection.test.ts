import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { ResourceType, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { createCollectionViaWizard } from "../fixtures/helpers"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () =>
  `E2E Test Collection ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.afterAll(async () => {
    await teardownE2ESite(siteId)
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    const collections = await db
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
      .where("title", "like", "E2E Test Collection %")
      .where("type", "=", ResourceType.Collection)
      .select("id")
      .execute()

    for (const { id } of collections) {
      await db.deleteFrom("Resource").where("parentId", "=", id).execute()
      await db.deleteFrom("Resource").where("id", "=", id).execute()
    }
  })

  test("admin can create a collection via the Create new wizard", async ({
    page,
  }) => {
    const title = UNIQUE_TITLE()

    // Arrange / Act
    await createCollectionViaWizard(page, { siteId, title })

    // Assert
    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
      .where("title", "=", title)
      .select(["id", "type"])
      .executeTakeFirst()
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
    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
      .where("title", "=", title)
      .select("id")
      .executeTakeFirst()
    expect(created).toBeUndefined()
  })
})
