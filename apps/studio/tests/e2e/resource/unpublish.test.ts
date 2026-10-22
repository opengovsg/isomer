import { expect, test } from "@playwright/test"
import {
  ResourceType,
  RoleType,
  ScheduledAction,
} from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { openSeededPageEditor } from "../fixtures/helpers"
import { seedFolder, seedPublishedPage } from "../fixtures/page-seed"
import { getResource } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"
import { getUserIdByEmail } from "../fixtures/user.db"

// A week out, so the 11:00 AM slot is always past the schedule lead time.
const WEEK_FROM_NOW = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

let siteId: number
let adminId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
  // Admin publishes the seeded live versions below.
  adminId = await getUserIdByEmail(TEST_EMAILS.admin)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can unpublish a live page immediately", async ({ page }) => {
    // Arrange
    const { page: live } = await seedPublishedPage({ siteId, userId: adminId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, live.id)
    await editor.openUnpublishModal()
    await editor.unpublishNow()

    // Assert
    await editor.expectUnpublishedToast()
    await expect
      .poll(async () => (await getResource(live.id))?.publishedVersionId)
      .toBeNull()
  })

  test("admin can schedule a live page to unpublish later", async ({
    page,
  }) => {
    // Arrange
    const { page: live } = await seedPublishedPage({ siteId, userId: adminId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, live.id)
    await editor.openUnpublishModal()
    await editor.scheduleUnpublishFor(WEEK_FROM_NOW())

    // Assert
    await editor.expectScheduledUnpublishToast()
    await expect
      .poll(async () => (await getResource(live.id))?.scheduledAction)
      .toBe(ScheduledAction.Unpublish)
  })

  test("admin can cancel a scheduled unpublish", async ({ page }) => {
    // Arrange: a live page already scheduled to unpublish.
    const { page: live } = await seedPublishedPage({
      siteId,
      userId: adminId,
      scheduledAt: WEEK_FROM_NOW(),
      scheduledAction: ScheduledAction.Unpublish,
    })

    // Act: a scheduled page is locked for editing; the lock overlay exposes the
    // cancel action directly.
    const editor = await openSeededPageEditor(page, siteId, live.id)
    await editor.cancelSchedule()

    // Assert
    await expect
      .poll(async () => (await getResource(live.id))?.scheduledAction)
      .toBeNull()
  })

  test("a landing page with a live child cannot be unpublished", async ({
    page,
  }) => {
    // Arrange: a folder whose index page is live, plus a live sibling child —
    // the child is what blocks unpublishing the landing page.
    const { folder } = await seedFolder({ siteId })
    const { page: indexPage } = await seedPublishedPage({
      siteId,
      userId: adminId,
      parentId: folder.id,
      resourceType: ResourceType.IndexPage,
    })
    await seedPublishedPage({ siteId, userId: adminId, parentId: folder.id })

    // Act + Assert
    const editor = await openSeededPageEditor(page, siteId, indexPage.id)
    await editor.expectUnpublishBlockedByLiveChildren()
  })
})
