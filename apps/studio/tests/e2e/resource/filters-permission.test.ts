import { test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { roleTag, storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import {
  createCollectionWithTagCategories,
  deleteCollection,
} from "../fixtures/collection"
import { CollectionPO } from "../fixtures/collection.po"
import { provisionE2ESite } from "../fixtures/site"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

const dismissWelcomeModal = (email: string) =>
  db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()

const seedCollection = () =>
  createCollectionWithTagCategories(
    [
      {
        id: crypto.randomUUID(),
        label: "Topic",
        isRequired: false,
        options: [{ id: crypto.randomUUID(), label: "Technology" }],
      },
    ],
    siteId,
  )

test.describe("admin", { tag: roleTag("admin") }, () => {
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

// Core/Migrator are seeded with IsomerAdmin only — no site ResourcePermission
// (see ensureGodModeAdmin in fixtures/seed.ts). They still get implicit site
// Admin via getResourcePermission, so Filters must remain available.
for (const role of ["core", "migrator"] as const) {
  test.describe(
    `isomer admin (${role}) without site permission`,
    { tag: roleTag(role) },
    () => {
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

      test("can see and open Filters on the collection index", async ({
        page,
      }) => {
        const collection = new CollectionPO(page)
        await page.goto(`/sites/${siteId}/pages/${indexPageId}`)

        await collection.expectManageCollectionVisible()
        await collection.expectFiltersVisible()
        await collection.openFilters()
        await collection.expectManageFiltersDrawerOpen()
      })
    },
  )
}

for (const role of ["editor", "publisher"] as const) {
  test.describe(role, { tag: roleTag(role) }, () => {
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
