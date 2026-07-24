import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { DashboardPO, PageSettingsPO } from "~e2e/fixtures/po"
import {
  expectResourcePermalink,
  expectResourceTitle,
  seedRootPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded, getE2EUserId } from "~e2e/fixtures/user"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can update draft page title via PageSettingsModal", async ({
    page,
  }) => {
    // Arrange
    const pageTitle = `Settings Draft Page ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle,
    })
    const newTitle = `Renamed ${crypto.randomUUID().slice(0, 8)}`

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openPageSettings(pageTitle)

    const settings = new PageSettingsPO(page)
    await settings.expectLoaded()
    await settings.fillTitle(newTitle)
    await settings.saveDraft()

    // Assert
    await expectResourceTitle(seededPage.id).toBe(newTitle)
  })

  test("admin does not see redirect option when changing permalink on a draft page", async ({
    page,
  }) => {
    // Arrange
    const pageTitle = `Settings Draft Permalink ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle,
    })
    const newPermalink = `renamed-${crypto.randomUUID().slice(0, 8)}`

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openPageSettings(pageTitle)

    const settings = new PageSettingsPO(page)
    await settings.fillPermalink(newPermalink)
    await settings.expectRedirectOptionHidden()
    await settings.closeWithoutSaving()

    // Assert
    await expectResourcePermalink(seededPage.id).toBe(seededPage.permalink)
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
    // Arrange
    const pageTitle = `Settings Published Page ${crypto.randomUUID().slice(0, 8)}`
    const publisherId = await getE2EUserId(TEST_EMAILS.publisher)
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle,
      state: ResourceState.Published,
      userId: publisherId,
    })
    const newPermalink = `renamed-${crypto.randomUUID().slice(0, 8)}`

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openPageSettings(pageTitle)

    const settings = new PageSettingsPO(page)
    await settings.fillPermalink(newPermalink)
    await settings.expectRedirectOptionVisible()
    await settings.saveAndPublish()

    // Assert
    await expectResourcePermalink(seededPage.id).toBe(newPermalink)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can save draft page title via PageSettingsModal", async ({
    page,
  }) => {
    // Arrange
    const pageTitle = `Editor Draft Page ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle,
    })
    const newTitle = `Editor Renamed ${crypto.randomUUID().slice(0, 8)}`

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openPageSettings(pageTitle)

    const settings = new PageSettingsPO(page)
    await settings.expectLoaded()
    await settings.expectSaveButtonVisible()
    await settings.fillTitle(newTitle)
    await settings.saveDraft()

    // Assert
    await expectResourceTitle(seededPage.id).toBe(newTitle)
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
