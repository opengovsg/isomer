import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { createCollectionLinkViaWizard } from "~e2e/fixtures/helpers"
import { CollectionLinkPO } from "~e2e/fixtures/po"
import { deleteResourceById } from "~e2e/fixtures/reset"
import { getResource, seedCollection } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

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
  let createdLinkId: string | undefined

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    createdLinkId = undefined
  })

  test.afterEach(async () => {
    if (createdLinkId) {
      await deleteResourceById(createdLinkId)
    }
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
    createdLinkId = linkId
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
  let createdLinkId: string | undefined

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
    createdLinkId = undefined
  })

  test.afterEach(async () => {
    if (createdLinkId) {
      await deleteResourceById(createdLinkId)
    }
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
    createdLinkId = linkId
    await new CollectionLinkPO(page).expectLoaded()

    // Assert
    const created = await getResource(linkId)
    expect(created?.type).toBe("CollectionLink")
    expect(created?.parentId).toBe(collectionId)
  })
})
