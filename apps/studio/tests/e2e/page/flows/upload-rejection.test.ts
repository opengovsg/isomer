import { expect, test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  mockAssetUploadRoutes,
  mockPresignedPutUrl,
} from "~e2e/fixtures/network"
import {
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

// PAGE_EDITOR_E2E_SPEC.md 3.7 — rejected uploads (oversized, unsupported
// type) and the risky-file-extension warning modal, for both image blocks
// and file/link attachments. Ground-truth constants: `lib/fileUpload.ts`
// (MAX_IMG_FILE_SIZE_BYTES = 5MB, MAX_FILE_SIZE_BYTES = 50MB,
// RISKY_FILE_EXTENSIONS = .doc/.docx/.xls/.xlsx). In-memory buffer fixtures
// only, no new files on disk — mirrors `site/settings-logo.test.ts`.

const OVERSIZED_IMAGE = {
  name: "oversized.png",
  mimeType: "image/png",
  buffer: Buffer.alloc(6_000_000), // >5MB MAX_IMG_FILE_SIZE_BYTES
}

const UNSUPPORTED_IMAGE = {
  name: "malware.exe",
  mimeType: "application/octet-stream",
  buffer: Buffer.from("fake"),
}

const OVERSIZED_FILE = {
  name: "oversized.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.alloc(51_000_000), // >50MB MAX_FILE_SIZE_BYTES
}

const UNSUPPORTED_FILE = {
  name: "malware.exe",
  mimeType: "application/octet-stream",
  buffer: Buffer.from("fake"),
}

const RISKY_DOCX = {
  name: "risky.docx",
  mimeType:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  buffer: Buffer.from("fake docx content"),
}

const VALID_PDF = {
  name: "valid.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("valid pdf content"),
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
    test("an oversized image upload is rejected with an error", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      await editor.addBlockByLabel("Image")

      // Act
      await editor.uploadImage(OVERSIZED_IMAGE)

      // Assert
      await editor.expectFileUploadRejectionVisible()
    })

    test("an unsupported image file type is rejected with an error", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      await editor.addBlockByLabel("Image")

      // Act
      await editor.uploadImage(UNSUPPORTED_IMAGE)

      // Assert
      await editor.expectFileUploadRejectionVisible()
    })
  })

  // `editor.uploadImage`/`editor.removeUploadedImageButton` are reused
  // here even though these fixtures aren't images — both the image-block
  // control and this prose-link file attachment render through the same
  // `FileAttachment.tsx`, whose file input and "Remove file" button are
  // generic regardless of what kind of file is being attached (see the PO's
  // "Upload rejection + risky-file warning" section).
  test.describe("file / link attachment", () => {
    test("an oversized file attachment is rejected with an error", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      await editor.openBlockEditor(SEEDED_PROSE_BLOCK_LABEL)
      await editor.openLinkFileAttachment()

      // Act
      await editor.uploadImage(OVERSIZED_FILE)

      // Assert
      await editor.expectFileUploadRejectionVisible()
    })

    test("an unsupported file attachment type is rejected with an error", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      await editor.openBlockEditor(SEEDED_PROSE_BLOCK_LABEL)
      await editor.openLinkFileAttachment()

      // Act
      await editor.uploadImage(UNSUPPORTED_FILE)

      // Assert
      await editor.expectFileUploadRejectionVisible()
    })

    test("cancelling the risky-file-extension warning does not upload the file", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      await editor.openBlockEditor(SEEDED_PROSE_BLOCK_LABEL)
      await editor.openLinkFileAttachment()
      await editor.uploadImage(RISKY_DOCX)
      await editor.expectRiskyFileWarningVisible()

      // Act
      await editor.cancelRiskyFileWarning()

      // Assert
      await editor.expectRiskyFileWarningHidden()
      await expect(editor.removeUploadedImageButton()).not.toBeVisible()
    })

    test("confirming the risky-file-extension warning uploads the file", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      await editor.openBlockEditor(SEEDED_PROSE_BLOCK_LABEL)
      await editor.openLinkFileAttachment()
      await editor.uploadImage(RISKY_DOCX)
      await editor.expectRiskyFileWarningVisible()

      // Act
      await editor.confirmRiskyFileWarning()

      // Assert
      await editor.expectRiskyFileWarningHidden()
      await expect(editor.removeUploadedImageButton()).toBeVisible()
    })

    test("a failed file upload can be retried without reloading the page", async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)
      await editor.openBlockEditor(SEEDED_PROSE_BLOCK_LABEL)
      await editor.openLinkFileAttachment()
      await editor.uploadImage(UNSUPPORTED_FILE)
      await editor.expectFileUploadRejectionVisible()

      // Act: same dropzone, no reload — retry with a valid file
      await editor.uploadImage(VALID_PDF)

      // Assert
      await expect(editor.removeUploadedImageButton()).toBeVisible()
    })
  })
})
