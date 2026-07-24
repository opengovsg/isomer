import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { seedFolderWithPage } from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Publisher] })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher can schedule publish and cancel the schedule", async ({
    page,
  }) => {
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    const editor = new PageEditorPO(page)
    await editor.gotoPage(siteId, seededPage.id)
    await editor.expectLoaded()

    await editor.openScheduleModal()
    await editor.schedulePublishForToday()
    await editor.expectScheduledSuccessfully()
    await editor.expectCancelScheduleVisible()

    await editor.cancelSchedule()
    await editor.expectPublishButtonVisible()
  })
})
