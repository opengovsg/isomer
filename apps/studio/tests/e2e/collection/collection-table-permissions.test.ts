import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { seedCollectionPages } from "../fixtures/collection"
import { CollectionPO } from "../fixtures/collection.po"
import { DashboardPO } from "../fixtures/dashboard.po"
import { seedCollection } from "../fixtures/page-seed"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

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
