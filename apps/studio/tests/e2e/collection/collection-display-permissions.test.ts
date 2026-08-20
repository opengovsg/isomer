import { test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import {
  createCollectionWithTagCategories,
  deleteCollection,
} from "~e2e/fixtures/collection"
import { openCollectionIndexEditor } from "~e2e/fixtures/helpers"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

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
      // Arrange
      const collection = await openCollectionIndexEditor(
        page,
        siteId,
        indexPageId,
      )
      await collection.expectManageCollectionVisible()
      await collection.expectCollectionDisplayVisible()

      // Act / Assert — opening the drawer also waits for its heading
      await collection.openCollectionDisplay()
    })
  })
}
