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

  test("clicking back with unsaved edits opens the discard-changes modal", async ({
    page,
  }) => {
    // Arrange
    const unsavedText = `Unsaved ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.fillBlock(SEEDED_PROSE_BLOCK_LABEL, unsavedText)

    // Act
    await editor.clickDrawerBack()

    // Assert
    await editor.expectDiscardChangesModalVisible()
  })

  test("choosing to stay keeps the unsaved edit and the block sub-editor open", async ({
    page,
  }) => {
    // Arrange
    const unsavedText = `Unsaved ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.fillBlock(SEEDED_PROSE_BLOCK_LABEL, unsavedText)
    await editor.clickDrawerBack()

    // Act
    await editor.clickStayEditing()

    // Assert
    await editor.expectDiscardChangesModalHidden()
    await editor.expectProseTextboxContains(unsavedText)
  })

  test("choosing to discard reverts the edit and returns to the block list", async ({
    page,
  }) => {
    // Arrange
    const unsavedText = `Unsaved ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.fillBlock(SEEDED_PROSE_BLOCK_LABEL, unsavedText)
    await editor.clickDrawerBack()

    // Act
    await editor.clickConfirmDiscard()

    // Assert
    await editor.expectDiscardChangesModalHidden()
    await editor.expectAtBlockListRoot()
    await editor.expectBlockPreview(SEEDED_PROSE_BLOCK_LABEL)
    await editor.expectBlockAbsent(unsavedText)
  })

  test("clicking back with no edits does not open the discard-changes modal", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openBlockEditor(SEEDED_PROSE_BLOCK_LABEL)

    // Act
    await editor.clickDrawerBack()

    // Assert
    await editor.expectDiscardChangesModalHidden()
    await editor.expectAtBlockListRoot()
  })
})
