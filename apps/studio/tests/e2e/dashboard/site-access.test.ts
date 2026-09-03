import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { DashboardPO, SitesListPO } from "~e2e/fixtures/po"
import { seedFolder } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

/** No site exists at this ID for the lifetime of an e2e run. */
const NONEXISTENT_SITE_ID = 999_999_999

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("clicking a site from Your sites opens that site's own dashboard and content tree", async ({
    page,
  }) => {
    // Arrange
    const siteA = await provisionE2ESite({ roles: [RoleType.Editor] })
    const siteB = await provisionE2ESite({ roles: [RoleType.Editor] })
    await seedFolder({ siteId: siteA.siteId, folderTitle: "E2E Site A Folder" })
    await seedFolder({ siteId: siteB.siteId, folderTitle: "E2E Site B Folder" })

    // Act
    const sitesList = new SitesListPO(page)
    await sitesList.goto()
    await sitesList.clickSiteLink(siteA.siteName)

    // Assert
    const dashboard = new DashboardPO(page)
    await dashboard.expectResourceLinkVisible("E2E Site A Folder")
    await dashboard.expectResourceLinkHidden("E2E Site B Folder")
  })

  test("a role granted access to two sites sees both; a third ungranted site is hidden", async ({
    page,
  }) => {
    // Arrange
    const siteA = await provisionE2ESite({ roles: [RoleType.Editor] })
    const siteB = await provisionE2ESite({ roles: [RoleType.Editor] })
    // Editor is never granted a role on siteC.
    const siteC = await provisionE2ESite({ roles: [RoleType.Publisher] })

    // Act
    const sitesList = new SitesListPO(page)
    await sitesList.goto()

    // Assert
    await sitesList.expectSiteLinkVisible(siteA.siteName)
    await sitesList.expectSiteLinkVisible(siteB.siteName)
    await sitesList.expectSiteLinkHidden(siteC.siteName)
  })

  test("a nonexistent siteId renders the access-denied screen", async ({
    page,
  }) => {
    // Arrange / Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(NONEXISTENT_SITE_ID)

    // Assert
    await dashboard.expectSiteAccessDenied()
  })

  test("an existing but unauthorized siteId renders the same access-denied screen", async ({
    page,
  }) => {
    // Arrange: editor is never granted a role on this site.
    const unauthorizedSite = await provisionE2ESite({
      roles: [RoleType.Publisher],
    })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(unauthorizedSite.siteId)

    // Assert
    await dashboard.expectSiteAccessDenied()
  })
})
