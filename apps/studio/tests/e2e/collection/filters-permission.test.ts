import { test } from "@playwright/test"
import crypto from "crypto"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

import { roleTag, TEST_EMAILS } from "../fixtures/auth"
import {
  createCollectionWithTagCategories,
  deleteCollection,
} from "../fixtures/collection"
import { CollectionPO } from "../fixtures/collection.po"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

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
  let collectionId: string
  let indexPageId: string

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    ;({ collectionId, indexPageId } = await seedCollection())
  })

  test.afterEach(async () => {
    await deleteCollection(collectionId)
  })

  test("can see and open Filters on the collection index", async ({ page }) => {
    // Act
    const collection = new CollectionPO(page)
    await collection.gotoIndex(siteId, indexPageId)
    await collection.expectManageCollectionVisible()
    await collection.expectFiltersVisible()
    await collection.openFilters()

    // Assert
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
      let collectionId: string
      let indexPageId: string

      test.beforeEach(async () => {
        await ensureUserOnboarded(TEST_EMAILS[role])
        ;({ collectionId, indexPageId } = await seedCollection())
      })

      test.afterEach(async () => {
        await deleteCollection(collectionId)
      })

      test("can see and open Filters on the collection index", async ({
        page,
      }) => {
        // Act
        const collection = new CollectionPO(page)
        await collection.gotoIndex(siteId, indexPageId)
        await collection.expectManageCollectionVisible()
        await collection.expectFiltersVisible()
        await collection.openFilters()

        // Assert
        await collection.expectManageFiltersDrawerOpen()
      })
    },
  )
}

for (const role of ["editor", "publisher"] as const) {
  test.describe(role, { tag: roleTag(role) }, () => {
    let collectionId: string
    let indexPageId: string

    test.beforeEach(async () => {
      await ensureUserOnboarded(TEST_EMAILS[role])
      ;({ collectionId, indexPageId } = await seedCollection())
    })

    test.afterEach(async () => {
      await deleteCollection(collectionId)
    })

    test("cannot see Filters on the collection index", async ({ page }) => {
      // Act
      const collection = new CollectionPO(page)
      await collection.gotoIndex(siteId, indexPageId)
      await collection.expectManageCollectionVisible()
      await collection.expectCollectionDisplayVisible()

      // Assert
      await collection.expectFiltersHidden()
    })
  })
}
