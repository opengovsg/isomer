import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
} from "~e2e/fixtures/resource"
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

  test("editing a block without saving updates the preview immediately", async ({
    page,
  }) => {
    // Arrange
    const unsavedText = `Unsaved ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act
    await editor.fillBlock(SEEDED_PROSE_BLOCK_LABEL, unsavedText)

    // Assert
    await editor.expectPreviewContains(unsavedText)
  })

  test("the preview still shows the saved text after save and reload", async ({
    page,
  }) => {
    // Arrange
    const savedText = `Saved ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, savedText)

    // Act
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectPreviewContains(savedText)
  })

  test("reloading without saving reverts the preview to the last-saved content, not the abandoned edit", async ({
    page,
  }) => {
    // Arrange: establish a saved baseline, then make a second, unsaved edit.
    const savedText = `Saved ${crypto.randomUUID().slice(0, 8)}`
    const abandonedText = `Abandoned ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, savedText)
    await editor.fillBlock(savedText, abandonedText)
    await editor.expectPreviewContains(abandonedText)

    // Act
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectPreviewContains(savedText)
  })
})
