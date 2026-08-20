import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  getResourceDraftBlobContent,
  seedArticlePage,
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
  seedRootPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor],
  })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can edit a page inside a folder and persist changes after reload", async ({
    page,
  }) => {
    // Arrange
    const editedText = `Edited ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, editedText)
    await expect
      .poll(() => getResourceDraftBlobContent(seededPage.id))
      .toContain(editedText)
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectBlockPreview(editedText)
  })

  test("admin can edit a standalone Content page's header summary and prose block, persisting after reload", async ({
    page,
  }) => {
    // Arrange
    const editedSummary = `Edited summary ${crypto.randomUUID().slice(0, 8)}`
    const editedText = `Edited block ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E Content Page ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openMetaSettings()
    await editor.fillFormFieldByLabel("Page summary", editedSummary)
    await editor.saveMetaSettings()
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, editedText)
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectBlockPreview(editedText)
    await editor.openMetaSettings()
    await editor.expectFormFieldValue("Page summary", editedSummary)
  })

  test("admin can edit a standalone Article page's header summary and prose block, persisting after reload", async ({
    page,
  }) => {
    // Arrange
    const editedSummary = `Edited article summary ${crypto.randomUUID().slice(0, 8)}`
    const editedText = `Edited block ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedArticlePage({
      siteId,
      pageTitle: `E2E Article Page ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openMetaSettings()
    await editor.fillFormFieldByLabel("Article summary", editedSummary)
    await editor.saveMetaSettings()
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, editedText)
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectBlockPreview(editedText)
    await editor.openMetaSettings()
    await editor.expectFormFieldValue("Article summary", editedSummary)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can edit a page inside a folder and persist changes after reload", async ({
    page,
  }) => {
    // Arrange
    const editedText = `Editor edit ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, editedText)
    await expect
      .poll(() => getResourceDraftBlobContent(seededPage.id))
      .toContain(editedText)
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectBlockPreview(editedText)
  })
})
