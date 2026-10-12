import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { CollectionPO } from "~e2e/fixtures/po/collection"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import {
  createCollectionLink,
  createCollectionPage,
  createCollectionWithTagCategories,
  getRootPageId,
} from "../fixtures/collection"
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

    test("admin can save after filling the required tag category", async ({
      page,
    }) => {
      // Arrange
      const collection = new CollectionPO(page)
      await page.goto(`/sites/${siteId}/links/${linkId}`)
      await collection.expectItemSaveDisabled()

      // Act
      await collection.selectTagOption(TAG_CATEGORY_LABEL, TAG_OPTION_LABEL)
      await collection.expectItemSaveEnabled()
      await collection.saveCollectionLink()
      await expect(page.getByText("Link updated!")).toBeVisible()

      // Assert
      const tagged = await getResourceDraftTagged(linkId)
      expect(tagged).toContain(TAG_OPTION_ID)
    })

    test("save stays disabled while the required tag category is unfilled", async ({
      page,
    }) => {
      // Arrange
      const collection = new CollectionPO(page)
      await page.goto(`/sites/${siteId}/links/${linkId}`)

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
      // Arrange
      const collection = new CollectionPO(page)
      await page.goto(`/sites/${siteId}/pages/${pageId}`)
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
      await page.goto(`/sites/${siteId}/pages/${pageId}`)
      await collection.openArticleHeader()

      // Assert
      await collection.expectArticleHeaderSaveDisabled()
      await collection.expectRequiredTagError()
    })
  },
)
