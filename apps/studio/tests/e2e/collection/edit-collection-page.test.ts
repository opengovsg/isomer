import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  expectResourceDraftBlobContains,
  seedCollectionWithPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can edit a collection page article summary and persist after reload", async ({
    page,
  }) => {
    const editedSummary = `Edited summary ${crypto.randomUUID().slice(0, 8)}`

    // Arrange
    const { collectionPage } = await seedCollectionWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, collectionPage.id)

    // Act
    await editor.editArticleHeaderSummary(editedSummary)

    // Assert
    await expectResourceDraftBlobContains(collectionPage.id, editedSummary)
    await editor.reload()
    await editor.expectLoaded()
    await editor.expectArticleHeaderSummary(editedSummary)
  })
})
