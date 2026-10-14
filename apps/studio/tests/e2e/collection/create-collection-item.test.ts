import { test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { createCollectionItemViaWizard } from "~e2e/fixtures/helpers"
import { DashboardPO } from "~e2e/fixtures/po"
import {
  expectResource,
  expectResourcesByParentCount,
  seedRootCollection,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { ResourceType, RoleType } from "~prisma/generated/generatedEnums"

const UNIQUE_TITLE = (label: string) =>
  `E2E Test ${label} ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor],
  })
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

  test("admin can create a collection page via the wizard", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE("Collection Page")

    // Act
    const { itemId } = await createCollectionItemViaWizard(page, {
      siteId,
      collectionId,
      type: "Page",
      title,
    })

    // Assert
    await expectResource(itemId).toMatchObject({
      type: "CollectionPage",
      parentId: collectionId,
    })
  })

  test("admin can create a collection link via the wizard", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE("Collection Link")

    // Act
    const { itemId } = await createCollectionItemViaWizard(page, {
      siteId,
      collectionId,
      type: "Link or file",
      title,
    })

    // Assert
    await expectResource(itemId).toMatchObject({
      type: "CollectionLink",
      parentId: collectionId,
    })
  })

  test("admin can cancel the add collection item wizard without creating a page", async ({
    page,
  }) => {
    const dashboard = new DashboardPO(page)

    // Arrange
    await dashboard.gotoCollection(siteId, collectionId)

    // Act
    await dashboard.openCollectionItemWizard()
    await dashboard.cancelCollectionItemWizard()

    // Assert
    await expectResourcesByParentCount({
      siteId,
      parentId: collectionId,
      type: ResourceType.CollectionPage,
    }).toBe(0)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  let collectionId: string

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
    collectionId = (
      await seedRootCollection({ siteId, collectionTitle: "E2E Item Coll" })
    ).collection.id
  })

  test("editor can create a collection page via the wizard", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE("Collection Page")

    // Act
    const { itemId } = await createCollectionItemViaWizard(page, {
      siteId,
      collectionId,
      type: "Page",
      title,
    })

    // Assert
    await expectResource(itemId).toMatchObject({
      type: "CollectionPage",
      parentId: collectionId,
    })
  })

  test("editor can create a collection link via the wizard", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE("Collection Link")

    // Act
    const { itemId } = await createCollectionItemViaWizard(page, {
      siteId,
      collectionId,
      type: "Link or file",
      title,
    })

    // Assert
    await expectResource(itemId).toMatchObject({
      type: "CollectionLink",
      parentId: collectionId,
    })
  })
})
