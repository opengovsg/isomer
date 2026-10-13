import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import {
  createCollectionPage,
  createCollectionWithTagCategories,
  deleteCollection,
} from "../fixtures/collection"
import { CollectionPO } from "../fixtures/collection.po"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { getResourceDraftTagged } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const TAG_OPTION_ID = crypto.randomUUID()

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor],
  })
  siteId = site.siteId
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  let collectionId: string

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
    const collection = await createCollectionWithTagCategories(
      [
        {
          id: crypto.randomUUID(),
          label: "Topic",
          isRequired: false,
          options: [{ id: TAG_OPTION_ID, label: "Technology" }],
        },
      ],
      siteId,
    )
    collectionId = collection.collectionId
  })

  test.afterEach(async () => {
    await deleteCollection(collectionId)
  })

  test("editor can assign tags on a collection page", async ({ page }) => {
    const collectionPage = await createCollectionPage({
      collectionId,
      siteId,
    })
    const collection = new CollectionPO(page)
    const editor = new PageEditorPO(page)

    // Arrange
    await editor.gotoPage(siteId, collectionPage.id)
    await collection.openArticleHeader()

    // Act
    await collection.selectTagOption("Topic", "Technology")
    await collection.saveArticleHeaderChanges()

    // Assert
    const tagged = await getResourceDraftTagged(collectionPage.id)
    expect(tagged).toContain(TAG_OPTION_ID)
  })
})
