import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { createFolderViaWizard, createPageViaWizard } from "../fixtures/helpers"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
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

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can create, edit, and publish a page inside a folder", async ({
    page,
  }) => {
    const folderTitle = UNIQUE_FOLDER()
    const pageTitle = UNIQUE_TITLE()
    const editedText = `Lifecycle ${crypto.randomUUID().slice(0, 8)}`

    const { folderId } = await createFolderViaWizard(page, {
      siteId,
      title: folderTitle,
    })
    await createPageViaWizard(page, {
      startUrl: `/sites/${siteId}/folders/${folderId}`,
      title: pageTitle,
      siteId,
    })

    const editor = new PageEditorPO(page)
    await editor.expectLoaded()
    await editor.addAndFillTextBlock(editedText)

    await editor.clickPublish()
    await editor.expectPublishedToast()

    const resource = await db
      .selectFrom("Resource")
      .where("siteId", "=", siteId)
      .where("title", "=", pageTitle)
      .select(["state", "parentId"])
      .executeTakeFirst()
    expect(resource?.state).toBe(ResourceState.Published)
    expect(resource?.parentId).toBe(folderId)
  })
})
