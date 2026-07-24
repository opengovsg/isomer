import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { seedRootPage } from "../fixtures/page-seed"
import { PageSettingsPO } from "../fixtures/page-settings.po"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded, getE2EUserId } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
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

  test("admin can update draft page title via PageSettingsModal", async ({
    page,
  }) => {
    const pageTitle = `Settings Draft Page ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle,
    })
    const newTitle = `Renamed ${crypto.randomUUID().slice(0, 8)}`

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openPageSettings(pageTitle)

    const settings = new PageSettingsPO(page)
    await settings.expectLoaded()
    await settings.fillTitle(newTitle)
    await settings.saveDraft()

    const updated = await db
      .selectFrom("Resource")
      .where("id", "=", seededPage.id)
      .select("title")
      .executeTakeFirst()
    expect(updated?.title).toBe(newTitle)
  })

  test("admin does not see redirect option when changing permalink on a draft page", async ({
    page,
  }) => {
    const pageTitle = `Settings Draft Permalink ${crypto.randomUUID().slice(0, 8)}`
    await seedRootPage({
      siteId,
      pageTitle,
    })
    const newPermalink = `renamed-${crypto.randomUUID().slice(0, 8)}`

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openPageSettings(pageTitle)

    const settings = new PageSettingsPO(page)
    await settings.fillPermalink(newPermalink)
    await settings.expectRedirectOptionHidden()
  })

  test("admin sees redirect option when changing permalink on a published page", async ({
    page,
  }) => {
    const pageTitle = `Settings Published Page ${crypto.randomUUID().slice(0, 8)}`
    const publisherId = await getE2EUserId(TEST_EMAILS.publisher)
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle,
      state: ResourceState.Published,
      userId: publisherId,
    })
    const newPermalink = `renamed-${crypto.randomUUID().slice(0, 8)}`

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openPageSettings(pageTitle)

    const settings = new PageSettingsPO(page)
    await settings.fillPermalink(newPermalink)
    await settings.expectRedirectOptionVisible()
    await settings.saveAndPublish()

    const updated = await db
      .selectFrom("Resource")
      .where("id", "=", seededPage.id)
      .select("permalink")
      .executeTakeFirst()
    expect(updated?.permalink).toBe(newPermalink)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can save draft page title via PageSettingsModal", async ({
    page,
  }) => {
    const pageTitle = `Editor Draft Page ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle,
    })
    const newTitle = `Editor Renamed ${crypto.randomUUID().slice(0, 8)}`

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openPageSettings(pageTitle)

    const settings = new PageSettingsPO(page)
    await settings.expectLoaded()
    await settings.expectSaveButtonVisible()
    await settings.fillTitle(newTitle)
    await settings.saveDraft()

    const updated = await db
      .selectFrom("Resource")
      .where("id", "=", seededPage.id)
      .select("title")
      .executeTakeFirst()
    expect(updated?.title).toBe(newTitle)
  })

  test("editor does not see Publish immediately on a published page", async ({
    page,
  }) => {
    const pageTitle = `Editor Published Page ${crypto.randomUUID().slice(0, 8)}`
    await seedRootPage({
      siteId,
      pageTitle,
      state: ResourceState.Published,
    })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openPageSettings(pageTitle)

    const settings = new PageSettingsPO(page)
    await settings.expectLoaded()
    await settings.expectPublishImmediatelyHidden()
  })
})
