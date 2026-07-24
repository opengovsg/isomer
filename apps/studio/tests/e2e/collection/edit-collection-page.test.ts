import { test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { openSeededPageEditor } from "../fixtures/helpers"
import { seedCollectionWithPage } from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
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
    await editor.reload()
    await editor.expectLoaded()
    await editor.expectArticleHeaderSummary(editedSummary)
  })
})
