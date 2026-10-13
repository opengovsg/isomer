import { test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import {
  createCollectionLink,
  createCollectionPage,
  createCollectionWithTagCategories,
} from "~e2e/fixtures/collection"
import { CollectionLinkPO, CollectionPO, PageEditorPO } from "~e2e/fixtures/po"
import { expectResourceDraftTagged } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

// Shared across every test in this file: one required tag category with a
// single option, so both drawers have something to validate against.
const TAG_CATEGORY_ID = crypto.randomUUID()
const TAG_OPTION_ID = crypto.randomUUID()
const TAG_CATEGORY_LABEL = "Topic"
const TAG_OPTION_LABEL = "Technology"

test.describe(
  "collection link — required tag categories",
  { tag: roleTag("admin") },
  () => {
    let collectionId: string
    let linkId: string

    test.beforeEach(async () => {
      await ensureUserOnboarded(TEST_EMAILS.admin)
      const collection = await createCollectionWithTagCategories(
        [
          {
            id: TAG_CATEGORY_ID,
            label: TAG_CATEGORY_LABEL,
            isRequired: true,
            options: [{ id: TAG_OPTION_ID, label: TAG_OPTION_LABEL }],
          },
        ],
        siteId,
      )
      collectionId = collection.collectionId

      // Save is also gated on a non-empty, valid `ref` — seed one directly so
      // the test isolates the tag-category gate instead of driving the
      // separate link-picker UI.
      const link = await createCollectionLink({
        collectionId,
        siteId,
      })
      linkId = link.id
    })

    test("admin can save after filling the required tag category", async ({
      page,
    }) => {
      const collection = new CollectionPO(page)
      const linkEditor = new CollectionLinkPO(page)

      // Arrange
      await linkEditor.gotoLink(siteId, linkId)
      await collection.expectItemSaveDisabled()

      // Act
      await collection.selectTagOption(TAG_CATEGORY_LABEL, TAG_OPTION_LABEL)
      await collection.expectItemSaveEnabled()
      await collection.saveCollectionLink()

      // Assert
      await expectResourceDraftTagged(linkId).toContain(TAG_OPTION_ID)
    })

    test("save stays disabled while the required tag category is unfilled", async ({
      page,
    }) => {
      const collection = new CollectionPO(page)
      const linkEditor = new CollectionLinkPO(page)

      // Arrange
      await linkEditor.gotoLink(siteId, linkId)

      // Assert
      await collection.expectItemSaveDisabled()
      await collection.expectRequiredTagError()
    })
  },
)

test.describe(
  "collection page — required tag categories",
  { tag: roleTag("admin") },
  () => {
    let collectionId: string
    let pageId: string

    test.beforeEach(async () => {
      await ensureUserOnboarded(TEST_EMAILS.admin)
      const collection = await createCollectionWithTagCategories(
        [
          {
            id: TAG_CATEGORY_ID,
            label: TAG_CATEGORY_LABEL,
            isRequired: true,
            options: [{ id: TAG_OPTION_ID, label: TAG_OPTION_LABEL }],
          },
        ],
        siteId,
      )
      collectionId = collection.collectionId

      const collectionPage = await createCollectionPage({
        collectionId,
        siteId,
      })
      pageId = collectionPage.id
    })

    test("admin can save after filling the required tag category", async ({
      page,
    }) => {
      const collection = new CollectionPO(page)
      const editor = new PageEditorPO(page)

      // Arrange
      await editor.gotoPage(siteId, pageId)
      await collection.openArticleHeader()
      await collection.expectPageSaveChangesDisabled()

      // Act
      await collection.selectTagOption(TAG_CATEGORY_LABEL, TAG_OPTION_LABEL)
      await collection.expectPageSaveChangesEnabled()
      await collection.saveArticleHeaderChanges()

      // Assert
      await expectResourceDraftTagged(pageId).toContain(TAG_OPTION_ID)
    })

    test("save stays disabled while the required tag category is unfilled", async ({
      page,
    }) => {
      const collection = new CollectionPO(page)
      const editor = new PageEditorPO(page)

      // Arrange
      await editor.gotoPage(siteId, pageId)
      await collection.openArticleHeader()

      // Assert
      await collection.expectPageSaveChangesDisabled()
      await collection.expectRequiredTagError()
    })
  },
)
