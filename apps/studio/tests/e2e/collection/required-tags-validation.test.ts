import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { roleTag, TEST_EMAILS } from "../fixtures/auth"
import {
  createCollectionLink,
  createCollectionPage,
  createCollectionWithTagCategories,
  deleteCollection,
  getRootPageId,
} from "../fixtures/collection"
import { CollectionLinkPO } from "../fixtures/collection-link.po"
import { CollectionPO } from "../fixtures/collection.po"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { getResourceDraftTagged } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

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
      const rootPageId = await getRootPageId(siteId)
      const link = await createCollectionLink({
        collectionId,
        ref: `[resource:${siteId}:${rootPageId}]`,
        siteId,
      })
      linkId = link.id
    })

    test.afterEach(async () => {
      await deleteCollection(collectionId)
    })

    test("admin can save after filling the required tag category", async ({
      page,
    }) => {
      // Arrange
      const collection = new CollectionPO(page)
      const linkEditor = new CollectionLinkPO(page)
      await linkEditor.gotoLink(siteId, linkId)
      await collection.expectItemSaveDisabled()

      // Act
      await collection.selectTagOption(TAG_CATEGORY_LABEL, TAG_OPTION_LABEL)
      await collection.expectItemSaveEnabled()
      await collection.saveCollectionLink()

      // Assert
      const tagged = await getResourceDraftTagged(linkId)
      expect(tagged).toContain(TAG_OPTION_ID)
    })

    test("save stays disabled while the required tag category is unfilled", async ({
      page,
    }) => {
      // Arrange
      const collection = new CollectionPO(page)
      const linkEditor = new CollectionLinkPO(page)
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

    test.afterEach(async () => {
      await deleteCollection(collectionId)
    })

    test("admin can save after filling the required tag category", async ({
      page,
    }) => {
      // Arrange
      const collection = new CollectionPO(page)
      const editor = new PageEditorPO(page)
      await editor.gotoPage(siteId, pageId)
      await collection.openArticleHeader()
      await collection.expectArticleHeaderSaveDisabled()

      // Act
      await collection.selectTagOption(TAG_CATEGORY_LABEL, TAG_OPTION_LABEL)
      await collection.expectArticleHeaderSaveEnabled()
      await collection.saveArticleHeaderChanges()

      // Assert
      const tagged = await getResourceDraftTagged(pageId)
      expect(tagged).toContain(TAG_OPTION_ID)
    })

    test("save stays disabled while the required tag category is unfilled", async ({
      page,
    }) => {
      // Arrange
      const collection = new CollectionPO(page)
      const editor = new PageEditorPO(page)
      await editor.gotoPage(siteId, pageId)
      await collection.openArticleHeader()

      // Assert
      await collection.expectArticleHeaderSaveDisabled()
      await collection.expectRequiredTagError()
    })
  },
)
