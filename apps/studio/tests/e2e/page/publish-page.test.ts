import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  expectResourceDraftBlobId,
  expectResourceState,
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded, getE2EUserId } from "~e2e/fixtures/user"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Publisher, RoleType.Editor],
  })
  siteId = site.siteId
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher can publish a draft page", async ({ page }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.clickPublish()
    await editor.expectPublishedToast()

    // Assert
    await expectResourceState(seededPage.id).toBe(ResourceState.Published)
  })

  test("publisher cannot publish a published page with no pending edits", async ({
    page,
  }) => {
    // Arrange
    const publisherId = await getE2EUserId(TEST_EMAILS.publisher)
    const { page: seededPage } = await seedFolderWithPage({
      siteId,
      state: ResourceState.Published,
      userId: publisherId,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Assert
    await editor.expectPublishButtonDisabled()
    await expectResourceDraftBlobId(seededPage.id).toBeNull()
  })

  test("publisher can edit a published page and republish changes", async ({
    page,
  }) => {
    // Arrange
    const editedText = `Edited ${crypto.randomUUID().slice(0, 8)}`
    const publisherId = await getE2EUserId(TEST_EMAILS.publisher)
    const { page: seededPage } = await seedFolderWithPage({
      siteId,
      state: ResourceState.Published,
      userId: publisherId,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, editedText)
    await editor.expectPublishButtonEnabled()
    await editor.clickPublish()
    await editor.expectPublishedToast()

    // Assert
    await expectResourceState(seededPage.id).toBe(ResourceState.Published)
    await expectResourceDraftBlobId(seededPage.id).toBeNull()
    await editor.expectBlockPreview(editedText)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor sees a disabled Publish button on the page editor", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Assert
    await editor.expectPublishButtonDisabled()
  })
})
