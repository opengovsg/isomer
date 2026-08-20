import { test } from "@playwright/test"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { seedCollectionPages } from "~e2e/fixtures/collection"
import { DashboardPO } from "~e2e/fixtures/po"
import { CollectionPO } from "~e2e/fixtures/po"
import { seedCollection } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number
let collectionId: string
let indexPageId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
  const seeded = await seedCollection({ siteId })
  collectionId = seeded.collection.id
  indexPageId = seeded.indexPage.id
  await seedCollectionPages({
    siteId,
    collectionId,
    count: 26,
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can sort items on the collection dashboard", async ({
    page,
  }) => {
    const dashboard = new DashboardPO(page)

    // Arrange
    await dashboard.gotoCollection(siteId, collectionId)

    // Act
    await dashboard.sortCollectionBy("Alphabetical")

    // Assert
    await dashboard.expectCollectionRowVisible("E2E Sort Item 01")
    await dashboard.expectCollectionRowHidden("E2E Sort Item 26")
  })
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher can paginate items on the collection dashboard", async ({
    page,
  }) => {
    const dashboard = new DashboardPO(page)

    // Arrange
    await dashboard.gotoCollection(siteId, collectionId)
    await dashboard.sortCollectionBy("Alphabetical")
    await dashboard.expectCollectionRowVisible("E2E Sort Item 01")

    // Act
    await dashboard.goToCollectionTablePage(2)

    // Assert
    await dashboard.expectCollectionRowVisible("E2E Sort Item 26")
    await dashboard.expectCollectionRowHidden("E2E Sort Item 01")
  })
})

test.describe("nomember", { tag: roleTag("nomember") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.nomember)
  })

  test("cannot access the collection dashboard without site permission", async ({
    page,
  }) => {
    const dashboard = new DashboardPO(page)

    // Arrange / Act
    await dashboard.gotoCollection(siteId, collectionId)

    // Assert
    await dashboard.expectCollectionAccessDenied()
  })

  test("cannot access the collection index without site permission", async ({
    page,
  }) => {
    const collection = new CollectionPO(page)

    // Arrange / Act
    await collection.gotoIndex(siteId, indexPageId)

    // Assert
    await collection.expectIndexAccessDenied()
  })
})
