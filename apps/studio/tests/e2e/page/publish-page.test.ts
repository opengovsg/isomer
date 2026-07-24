import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { openSeededPageEditor } from "../fixtures/helpers"
import {
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
} from "../fixtures/page-seed"
import { getResource } from "../fixtures/resource.db"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded, getE2EUserId } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Publisher, RoleType.Editor],
  })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
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
    await expect
      .poll(async () => (await getResource(seededPage.id))?.state)
      .toBe(ResourceState.Published)
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
    await expect
      .poll(async () => (await getResource(seededPage.id))?.draftBlobId)
      .toBeNull()
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
    await expect
      .poll(async () => (await getResource(seededPage.id))?.draftBlobId)
      .not.toBeNull()
    await editor.expectPublishButtonEnabled()
    await editor.clickPublish()
    await editor.expectPublishedToast()

    // Assert
    await expect
      .poll(async () => (await getResource(seededPage.id))?.state)
      .toBe(ResourceState.Published)
    await expect
      .poll(async () => (await getResource(seededPage.id))?.draftBlobId)
      .toBeNull()
    await editor.expectBlockPreview(editedText)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor does not see the Publish button on the page editor", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Assert
    await editor.expectPublishButtonHidden()
  })
})
