import { test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { openSeededPageEditor } from "../fixtures/helpers"
import {
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
} from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor],
  })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can edit a page inside a folder and persist changes after reload", async ({
    page,
  }) => {
    const editedText = `Edited ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, editedText)

    await editor.reload()
    await editor.expectLoaded()
    await editor.expectBlockPreview(editedText)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can edit a page inside a folder and persist changes after reload", async ({
    page,
  }) => {
    const editedText = `Editor edit ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.editProseBlock(SEEDED_PROSE_BLOCK_LABEL, editedText)

    await editor.reload()
    await editor.expectLoaded()
    await editor.expectBlockPreview(editedText)
  })
})
