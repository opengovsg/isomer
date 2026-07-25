import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { CollectionLinkPO } from "../fixtures/collection-link.po"
import { createCollectionLinkViaWizard } from "../fixtures/helpers"
import { deleteResourcesByTitlePrefix } from "../fixtures/reset"
import { getResource } from "../fixtures/resource.db"
import { seedCollection } from "../fixtures/resource.seed"
import { provisionE2ESite } from "../fixtures/site"
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

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await deleteResourcesByTitlePrefix(siteId, "E2E Collection Link ")
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
    const created = await getResource(linkId)
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
    await deleteResourcesByTitlePrefix(siteId, "E2E Collection Link ")
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
    await new CollectionLinkPO(page).expectLoaded()

    // Assert
    const created = await getResource(linkId)
    expect(created?.type).toBe("CollectionLink")
    expect(created?.parentId).toBe(collectionId)
  })
})
