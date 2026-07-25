import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { provisionE2ESite } from "../fixtures/site"
import { SitesListPO } from "../fixtures/sites-list.po"
import { ensureUserOnboarded } from "../fixtures/user"

let siteName: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteName = site.siteName
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor sees their provisioned site on the dashboard", async ({
    page,
  }) => {
    const sitesList = new SitesListPO(page)

    // Arrange
    // (site provisioned in beforeAll)

    // Act
    await sitesList.goto()

    // Assert
    await sitesList.expectHeadingVisible()
    await sitesList.expectSiteLinkVisible(siteName)
  })
})

test.describe("nomember", { tag: roleTag("nomember") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.nomember)
  })

  test("user with no permissions sees empty state", async ({ page }) => {
    const sitesList = new SitesListPO(page)

    // Arrange
    // (user has no site access)

    // Act
    await sitesList.goto()

    // Assert
    await sitesList.expectEmptyState()
    await sitesList.expectSiteLinkHidden(siteName)
  })
})
