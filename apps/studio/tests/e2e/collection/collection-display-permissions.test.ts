import { test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import {
  createCollectionWithTagCategories,
  deleteCollection,
} from "../fixtures/collection"
import { openCollectionIndexEditor } from "../fixtures/helpers"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

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

    test("can open Collection display on the collection index", async ({
      page,
    }) => {
      // Act
      const collection = await openCollectionIndexEditor(
        page,
        siteId,
        indexPageId,
      )
      await collection.openCollectionDisplay()

      // Assert
      await collection.expectCollectionDisplayVisible()
    })
  })
}
