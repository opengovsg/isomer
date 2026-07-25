import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import {
  createFolderViaWizard,
  createPageViaWizard,
  openSeededPageEditor,
} from "../fixtures/helpers"
import {
  getResourceByTitle,
  getResourceDraftBlobContent,
} from "../fixtures/resource.db"
import { expectResourceState } from "../fixtures/resource.expect"
import {
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
} from "../fixtures/resource.seed"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () =>
  `E2E Lifecycle Page ${crypto.randomUUID().slice(0, 8)}`
const UNIQUE_FOLDER = () =>
  `E2E Lifecycle Folder ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Publisher],
  })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can create folder and page via wizard in folder", async ({
    page,
  }) => {
    // Arrange
    const folderTitle = UNIQUE_FOLDER()
    const pageTitle = UNIQUE_TITLE()

    // Act
    const { folderId } = await createFolderViaWizard(page, {
      siteId,
      title: folderTitle,
    })
    await createPageViaWizard(page, {
      startUrl: `/sites/${siteId}/folders/${folderId}`,
      title: pageTitle,
      siteId,
    })

    // Assert
    const resource = await getResourceByTitle({ siteId, title: pageTitle })
    expect(resource?.state).toBe(ResourceState.Draft)
    expect(resource?.parentId).toBe(folderId)
  })

  test("admin can edit and publish seeded page in folder", async ({ page }) => {
    // Arrange
    const editedText = `Lifecycle ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, editedText)
    await expect
      .poll(() => getResourceDraftBlobContent(seededPage.id))
      .toContain(editedText)
    await editor.clickPublish()
    await editor.expectPublishedToast()

    // Assert
    await expectResourceState(seededPage.id).toBe(ResourceState.Published)
    await editor.expectBlockPreview(editedText)
  })
})
