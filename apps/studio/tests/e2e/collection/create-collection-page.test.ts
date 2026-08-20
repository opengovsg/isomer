import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { ResourceType, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { createCollectionPageViaWizard } from "../fixtures/helpers"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { seedCollection } from "../fixtures/page-seed"
import { deleteResourcesByTitleLike } from "../fixtures/reset"
import { getResource, listResourcesByParent } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

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
    await deleteResourcesByTitleLike(siteId, "E2E Collection Page %")
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
    const childrenBefore = await listResourcesByParent({
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
    const childrenAfter = await listResourcesByParent({
      siteId,
      parentId: collectionId,
      type: ResourceType.CollectionPage,
    })
    expect(childrenAfter).toHaveLength(childrenBefore.length)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test.afterEach(async () => {
    await deleteResourcesByTitleLike(siteId, "E2E Collection Page %")
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
