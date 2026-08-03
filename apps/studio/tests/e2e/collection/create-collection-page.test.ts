import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { createCollectionPageViaWizard } from "~e2e/fixtures/helpers"
import { DashboardPO, PageEditorPO } from "~e2e/fixtures/po"
import { deleteResourcesByTitlePrefix } from "~e2e/fixtures/reset"
import {
  countResourcesByParent,
  getResource,
  seedCollection,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { ResourceType, RoleType } from "~prisma/generated/generatedEnums"

const UNIQUE_TITLE = () =>
  `E2E Collection Page ${crypto.randomUUID().slice(0, 8)}`

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
    await deleteResourcesByTitlePrefix(siteId, "E2E Collection Page ")
  })

  test("admin can create a collection page via the wizard", async ({
    page,
  }) => {
    const title = UNIQUE_TITLE()

    // Arrange / Act
    const { pageId } = await createCollectionPageViaWizard(page, {
      siteId,
      collectionId,
      title,
    })
    await new PageEditorPO(page).expectLoaded()

    // Assert
    const created = await getResource(pageId)
    expect(created?.title).toBe(title)
    expect(created?.type).toBe("CollectionPage")
    expect(created?.state).toBe("Draft")
    expect(created?.parentId).toBe(collectionId)
  })

  test("admin can cancel the add collection item wizard without creating a page", async ({
    page,
  }) => {
    const dashboard = new DashboardPO(page)
    const childrenBefore = await countResourcesByParent({
      siteId,
      parentId: collectionId,
      type: ResourceType.CollectionPage,
    })

    // Arrange
    await dashboard.gotoCollection(siteId, collectionId)

    // Act
    await dashboard.openCollectionItemWizard()
    await dashboard.cancelCollectionItemWizard()

    // Assert
    const childrenAfter = await countResourcesByParent({
      siteId,
      parentId: collectionId,
      type: ResourceType.CollectionPage,
    })
    expect(childrenAfter).toBe(childrenBefore)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test.afterEach(async () => {
    await deleteResourcesByTitlePrefix(siteId, "E2E Collection Page ")
  })

  test("editor can create a collection page via the wizard", async ({
    page,
  }) => {
    const title = UNIQUE_TITLE()

    // Arrange / Act
    const { pageId } = await createCollectionPageViaWizard(page, {
      siteId,
      collectionId,
      title,
    })
    await new PageEditorPO(page).expectLoaded()

    // Assert
    const created = await getResource(pageId)
    expect(created?.type).toBe("CollectionPage")
    expect(created?.parentId).toBe(collectionId)
  })
})
