import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import {
  createCollectionPage,
  createCollectionWithTagCategories,
  deleteCollection,
} from "~e2e/fixtures/collection"
import { PageEditorPO } from "~e2e/fixtures/po"
import { CollectionPO } from "~e2e/fixtures/po"
import { getResourceDraftTagged } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

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
