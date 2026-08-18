import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { createCollectionItemViaWizard } from "../fixtures/helpers"
import { seedRootCollection } from "../fixtures/page-seed"
import { getResourceByTitle } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = (label: string) =>
  `E2E Test ${label} ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  let collectionId: string

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    collectionId = (
      await seedRootCollection({ siteId, collectionTitle: "E2E Item Coll" })
    ).collection.id
  })

  test.afterEach(async () => {
    await db.deleteFrom("Resource").where("id", "=", collectionId).execute()
  })

  test("admin can create a collection page via the wizard", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE("Collection Page")

    // Act
    await createCollectionItemViaWizard(page, {
      siteId,
      collectionId,
      type: "Page",
      title,
    })

    // Assert
    const created = await getResourceByTitle({ siteId, title })
    expect(created).toBeTruthy()
    expect(created?.type).toBe("CollectionPage")
    expect(created?.parentId).toBe(collectionId)
  })

  test("admin can create a collection link via the wizard", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE("Collection Link")

    // Act
    await createCollectionItemViaWizard(page, {
      siteId,
      collectionId,
      type: "Link or file",
      title,
    })

    // Assert
    const created = await getResourceByTitle({ siteId, title })
    expect(created).toBeTruthy()
    expect(created?.type).toBe("CollectionLink")
    expect(created?.parentId).toBe(collectionId)
  })
})
