import { test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import {
  openSeededPageEditor,
  withSeededPageEditorAsRole,
} from "~e2e/fixtures/helpers"
import {
  expectResourceDraftBlobId,
  expectResourceState,
  getResourceDraftBlobId,
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded, getE2EUserId } from "~e2e/fixtures/user"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Publisher, RoleType.Editor, RoleType.Admin],
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
    await expectResourceDraftBlobId(seededPage.id).toBeNull()
  })

  test("cancelling the publish confirmation leaves the draft untouched", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    const draftBlobIdBefore = await getResourceDraftBlobId(seededPage.id)
    await editor.cancelPublishConfirmation()

    // Assert
    await editor.expectPublishButtonEnabled()
    await expectResourceState(seededPage.id).toBe(ResourceState.Draft)
    await expectResourceDraftBlobId(seededPage.id).toBe(draftBlobIdBefore)
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
    await expectResourceDraftBlobId(seededPage.id).not.toBeNull()
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

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin sees the Publish button on the page editor", async ({ page }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Assert
    await editor.expectPublishButtonVisible()
    await editor.expectPublishButtonEnabled()
  })
})

test.describe("separation of duties", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("editor saves a draft and a publisher signs in separately to publish it", async ({
    page,
    browser,
  }) => {
    // Arrange
    const editedText = `Edited ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    const editorPO = await openSeededPageEditor(page, siteId, seededPage.id)
    await editorPO.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, editedText)
    await editorPO.expectPublishButtonDisabled()
    await expectResourceDraftBlobId(seededPage.id).not.toBeNull()

    // Act — publisher publishes the editor's draft in a separate session
    await withSeededPageEditorAsRole(
      browser,
      "publisher",
      siteId,
      seededPage.id,
      async (publisher) => {
        await publisher.editor.clickPublish()
        await publisher.editor.expectPublishedToast()
      },
    )

    // Assert
    await expectResourceState(seededPage.id).toBe(ResourceState.Published)
    await expectResourceDraftBlobId(seededPage.id).toBeNull()
    await editorPO.reload()
    await editorPO.expectBlockPreview(editedText)
  })
})
