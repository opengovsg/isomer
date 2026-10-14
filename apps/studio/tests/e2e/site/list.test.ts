import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { SitesListPO } from "~e2e/fixtures/po"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

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
