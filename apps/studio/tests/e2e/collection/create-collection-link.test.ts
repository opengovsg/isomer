import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { CollectionLinkPO } from "../fixtures/collection-link.po"
import { createCollectionLinkViaWizard } from "../fixtures/helpers"
import { seedCollection } from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () =>
  `E2E Collection Link ${crypto.randomUUID().slice(0, 8)}`

let siteId: number
let collectionId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor],
  })
  siteId = site.siteId
  const { collection } = await seedCollection({ siteId })
  collectionId = collection.id
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await db
      .deleteFrom("Resource")
      .where("siteId", "=", siteId)
      .where("title", "like", "E2E Collection Link %")
      .execute()
  })

  test("admin can create a collection link via the wizard", async ({
    page,
  }) => {
    const title = UNIQUE_TITLE()

    // Arrange / Act
    const { linkId } = await createCollectionLinkViaWizard(page, {
      siteId,
      collectionId,
      title,
    })
    await new CollectionLinkPO(page).expectLoaded()

    // Assert
    const created = await db
      .selectFrom("Resource")
      .where("id", "=", linkId)
      .select(["title", "type", "state", "parentId"])
      .executeTakeFirst()
    expect(created?.title).toBe(title)
    expect(created?.type).toBe("CollectionLink")
    expect(created?.state).toBe("Draft")
    expect(created?.parentId).toBe(collectionId)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test.afterEach(async () => {
    await db
      .deleteFrom("Resource")
      .where("siteId", "=", siteId)
      .where("title", "like", "E2E Collection Link %")
      .execute()
  })

  test("editor can create a collection link via the wizard", async ({
    page,
  }) => {
    const title = UNIQUE_TITLE()

    // Arrange / Act
    const { linkId } = await createCollectionLinkViaWizard(page, {
      siteId,
      collectionId,
      title,
    })

    // Assert
    const created = await db
      .selectFrom("Resource")
      .where("id", "=", linkId)
      .select(["type", "parentId"])
      .executeTakeFirst()
    expect(created?.type).toBe("CollectionLink")
    expect(created?.parentId).toBe(collectionId)
  })
})
