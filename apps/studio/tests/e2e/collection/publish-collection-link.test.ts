import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import {
  createCollectionLink,
  createCollectionWithTagCategories,
  deleteCollection,
} from "~e2e/fixtures/collection"
import { CollectionLinkPO, PageEditorPO } from "~e2e/fixtures/po"
import {
  expectResourceDraftBlobId,
  expectResourceState,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

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
      const linkEditor = new CollectionLinkPO(page)
      const editor = new PageEditorPO(page)
      await linkEditor.gotoLink(siteId, link.id)
      await editor.expectPublishButtonEnabled()
      await editor.clickPublish()
      await editor.expectPublishedToast()

      // Assert
      await expectResourceState(link.id).toBe(ResourceState.Published)
      await expectResourceDraftBlobId(link.id).toBeNull()
    } finally {
      await deleteCollection(collectionId)
    }
  })
})
