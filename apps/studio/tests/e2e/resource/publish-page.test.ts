import { expect, test } from "@playwright/test"
import { db } from "~/server/modules/database"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { seedFolderWithPage } from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

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
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    const editor = new PageEditorPO(page)
    await editor.gotoPage(siteId, seededPage.id)
    await editor.expectLoaded()
    await editor.clickPublish()
    await editor.expectPublishedToast()

    const resource = await db
      .selectFrom("Resource")
      .where("id", "=", seededPage.id)
      .select("state")
      .executeTakeFirst()
    expect(resource?.state).toBe(ResourceState.Published)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor does not see the Publish button on the page editor", async ({
    page,
  }) => {
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    const editor = new PageEditorPO(page)
    await editor.gotoPage(siteId, seededPage.id)
    await editor.expectLoaded()
    await editor.expectPublishButtonHidden()
  })
})
