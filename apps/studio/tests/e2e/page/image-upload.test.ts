import { expect, test } from "@playwright/test"
import { fileURLToPath } from "url"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  mockAssetUploadRoutes,
  mockPresignedPutUrl,
} from "~e2e/fixtures/network"
import { seedFolderWithPage } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const LOGO_FIXTURE = fileURLToPath(
  new URL("../fixtures/e2e-logo.png", import.meta.url),
)
const LOGO_FILENAME = "e2e-logo.png"

const SECOND_IMAGE = {
  name: "second-image.png",
  mimeType: "image/png",
  buffer: Buffer.from("fake-image-2"),
}

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async ({ page }) => {
    await mockAssetUploadRoutes(page)
    await mockPresignedPutUrl(page)
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.describe("image block", () => {
    test("admin can upload an image, set alt text and caption, and persist after reload", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      const alt = "A view of the site's landing page from above"
      const caption = "Taken during the site launch review."

      // Act
      await editor.addBlockByLabel("Image")
      await editor.uploadImage(LOGO_FIXTURE)
      await expect(editor.imageFilenameText(LOGO_FILENAME)).toBeVisible()
      await editor.fillFormFieldByLabel("Alternate text", alt)
      await editor.fillFormFieldByLabel("Caption", caption)
      await editor.saveComplexBlock()
      await editor.reload()
      await editor.expectLoaded()
      await editor.openBlockEditor(LOGO_FILENAME)

      // Assert
      await expect(editor.imageFilenameText(LOGO_FILENAME)).toBeVisible()
      await editor.expectFormFieldValue("Alternate text", alt)
      await editor.expectFormFieldValue("Caption", caption)
    })

    test("admin can replace an uploaded image with a different one", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      const alt = "A view of the community garden in autumn"
      const caption = "Updated after the autumn planting."
      await editor.addBlockByLabel("Image")
      await editor.uploadImage(LOGO_FIXTURE)
      await expect(editor.imageFilenameText(LOGO_FILENAME)).toBeVisible()

      // Act: remove the first image, upload a different one in its place
      await editor.removeUploadedImageButton().click()
      await editor.uploadImage(SECOND_IMAGE)
      await expect(editor.imageFilenameText(SECOND_IMAGE.name)).toBeVisible()
      await editor.fillFormFieldByLabel("Alternate text", alt)
      await editor.fillFormFieldByLabel("Caption", caption)
      await editor.saveComplexBlock()
      await editor.reload()
      await editor.expectLoaded()
      await editor.openBlockEditor(SECOND_IMAGE.name)

      // Assert
      await expect(editor.imageFilenameText(SECOND_IMAGE.name)).toBeVisible()
      await editor.expectFormFieldValue("Alternate text", alt)
      await editor.expectFormFieldValue("Caption", caption)
    })

    test("removing the uploaded image resets the field to an empty dropzone and disables Save", async ({
      page,
    }) => {
      // Arrange: a previously saved image block
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      await editor.addBlockByLabel("Image")
      await editor.uploadImage(LOGO_FIXTURE)
      await expect(editor.imageFilenameText(LOGO_FILENAME)).toBeVisible()
      await editor.fillFormFieldByLabel(
        "Alternate text",
        "A view of the site's landing page from above",
      )
      await editor.saveComplexBlock()
      await editor.reload()
      await editor.expectLoaded()
      await editor.openBlockEditor(LOGO_FILENAME)
      await expect(editor.imageFilenameText(LOGO_FILENAME)).toBeVisible()

      // Act
      await editor.removeUploadedImageButton().click()

      // Assert: `src` is a required field, so clearing it can't be saved as-is
      // — the control reverts to the empty upload dropzone rather than
      // persisting an "image block with no image" state.
      await expect(editor.removeUploadedImageButton()).not.toBeVisible()
      await editor.expectSaveBlockButtonDisabled()
    })
  })

  test.describe("image gallery block", () => {
    test("admin can add multiple images with alt text and captions, persisted after reload", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      const galleryImage2 = {
        name: "gallery-image-2.png",
        mimeType: "image/png",
        buffer: Buffer.from("fake-gallery-image-2"),
      }
      const alt1 = "A view of the renovated library entrance"
      const caption1 = "Taken after the renovation completed."
      const alt2 = "A view of the community garden in spring"
      const caption2 = "Taken during the spring open house."

      // Act: replace the first two default placeholder items — newly-added
      // blocks already seed three schema-valid images (`DEFAULT_BLOCKS.imagegallery`).
      await editor.addBlockByLabel("Image gallery")
      await editor.openGalleryItem(/placeholder_no_image|Item 1/)
      await editor.uploadImage(LOGO_FIXTURE)
      await expect(editor.imageFilenameText(LOGO_FILENAME)).toBeVisible()
      await editor.fillFormFieldByLabel("Alternate text", alt1)
      await editor.fillFormFieldByLabel("Caption", caption1)
      await editor.returnFromNestedItem("Images")

      await editor.openGalleryItem(/placeholder_no_image|Item 2/)
      await editor.uploadImage(galleryImage2)
      await expect(editor.imageFilenameText(galleryImage2.name)).toBeVisible()
      await editor.fillFormFieldByLabel("Alternate text", alt2)
      await editor.fillFormFieldByLabel("Caption", caption2)
      await editor.returnFromNestedItem("Images")

      await editor.saveComplexBlock()
      await editor.reload()
      await editor.expectLoaded()
      await editor.openBlockEditor("Image Gallery")

      // Assert: first item persisted
      await editor.openGalleryItem(/e2e-logo\.png|Item 1/)
      await editor.expectFormFieldValue("Alternate text", alt1)
      await editor.expectFormFieldValue("Caption", caption1)
      await editor.returnFromNestedItem("Images")

      // Assert: second item persisted
      await editor.openGalleryItem(/gallery-image-2\.png|Item 2/)
      await editor.expectFormFieldValue("Alternate text", alt2)
      await editor.expectFormFieldValue("Caption", caption2)
    })
  })
})
