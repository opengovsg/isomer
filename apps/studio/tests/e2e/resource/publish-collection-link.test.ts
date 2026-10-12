import { expect, test } from "@playwright/test"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { roleTag, TEST_EMAILS } from "../fixtures/auth"
import {
  createCollectionLink,
  createCollectionWithTagCategories,
  deleteCollection,
} from "../fixtures/collection"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { getResource } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Publisher] })
  siteId = site.siteId
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher can publish a collection link", async ({ page }) => {
    // Arrange: a collection link with no required tag categories, so the
    // only gate on publishing is the same draft/publish flow a page uses.
    const { collectionId } = await createCollectionWithTagCategories([], siteId)
    const link = await createCollectionLink({
      collectionId,
      ref: "https://example.com",
      siteId,
    })

    try {
      // Act: the collection link editor reuses the same PublishButton and
      // page.publishPage flow as a Page, just under the /links/ route.
      const editor = new PageEditorPO(page)
      await page.goto(`/sites/${siteId}/links/${link.id}`)
      await editor.expectPublishButtonEnabled()
      await editor.clickPublish()
      await editor.expectPublishedToast()

      // Assert
      await expect
        .poll(async () => (await getResource(link.id))?.state)
        .toBe(ResourceState.Published)
      await expect
        .poll(async () => (await getResource(link.id))?.draftBlobId)
        .toBeNull()
    } finally {
      await deleteCollection(collectionId)
    }
  })
})
