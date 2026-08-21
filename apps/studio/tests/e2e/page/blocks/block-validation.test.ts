import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import { seedFolderWithPage } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("clearing an image block's alt text disables Save and shows an inline error", async ({
    page,
  }) => {
    // Arrange: `DEFAULT_BLOCKS.image` pre-fills a valid placeholder alt text
    // (`ComponentSelector.tsx`'s `newComponent` seed) — Save starts enabled,
    // so this test clears the field itself to produce the invalid state,
    // rather than assuming a freshly-added block starts invalid.
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.addBlockByLabel("Image")
    await editor.expectSaveBlockButtonEnabled()

    // Act
    await editor.fillFormFieldByLabel("Alternate text", "")

    // Assert
    await editor.expectSaveBlockButtonDisabled()
    // Exact copy depends on whether the schema treats a cleared `alt` as
    // absent ("required" error, "cannot be empty") or present-but-empty
    // ("pattern" error, "must be descriptive...") — accept either.
    await editor.expectFieldErrorText(
      /Alternate text.*(must be descriptive|cannot be empty)/i,
    )
  })

  test("refilling the alt text re-enables Save and clears the error", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.addBlockByLabel("Image")
    await editor.fillFormFieldByLabel("Alternate text", "")
    await editor.expectSaveBlockButtonDisabled()

    // Act
    await editor.fillFormFieldByLabel(
      "Alternate text",
      "A descriptive caption of the uploaded image",
    )

    // Assert
    await editor.expectSaveBlockButtonEnabled()
  })
})
