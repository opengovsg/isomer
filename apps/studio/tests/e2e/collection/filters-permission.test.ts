import { test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import {
  createCollectionWithTagCategories,
  deleteCollection,
} from "../fixtures/collection"
import { CollectionPO } from "../fixtures/collection.po"
import { getSeedSiteId } from "../fixtures/seed"

const siteId = getSeedSiteId()

const dismissWelcomeModal = (email: string) =>
  db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()

const seedCollection = () =>
  createCollectionWithTagCategories([
    {
      id: crypto.randomUUID(),
      label: "Topic",
      isRequired: false,
      options: [{ id: crypto.randomUUID(), label: "Technology" }],
    },
  ])

test.describe("admin", () => {
  test.use({ storageState: storageStateFor("admin") })

  let collectionId: string
  let indexPageId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    ;({ collectionId, indexPageId } = await seedCollection())
  })

  test.afterEach(async () => {
    await deleteCollection(collectionId)
  })

  test("can see and open Filters on the collection index", async ({ page }) => {
    const collection = new CollectionPO(page)
    await page.goto(`/sites/${siteId}/pages/${indexPageId}`)

    await collection.expectManageCollectionVisible()
    await collection.expectFiltersVisible()
    await collection.openFilters()
    await collection.expectManageFiltersDrawerOpen()
  })
})

for (const role of ["editor", "publisher"] as const) {
  test.describe(role, () => {
    test.use({ storageState: storageStateFor(role) })

    let collectionId: string
    let indexPageId: string

    test.beforeEach(async () => {
      await dismissWelcomeModal(TEST_EMAILS[role])
      ;({ collectionId, indexPageId } = await seedCollection())
    })

    test.afterEach(async () => {
      await deleteCollection(collectionId)
    })

    test("cannot see Filters on the collection index", async ({ page }) => {
      const collection = new CollectionPO(page)
      await page.goto(`/sites/${siteId}/pages/${indexPageId}`)

      await collection.expectManageCollectionVisible()
      await collection.expectCollectionDisplayVisible()
      await collection.expectFiltersHidden()
    })
  })
}
