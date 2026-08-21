import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import {
  getCollectionItemTitles,
  getIndexPageId,
} from "~e2e/fixtures/collection"
import {
  createCollectionLinkViaWizard,
  createCollectionPageViaWizard,
  createCollectionViaWizard,
} from "~e2e/fixtures/helpers"
import { CollectionLinkPO, DashboardPO, PageEditorPO } from "~e2e/fixtures/po"
import { expectResourceState } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

const UNIQUE = (label: string) =>
  `E2E ${label} ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can create and publish a collection with a page and a link", async ({
    page,
  }) => {
    const collectionTitle = UNIQUE("Published Collection")
    const pageTitle = UNIQUE("Published Collection Page")
    const linkTitle = UNIQUE("Published Collection Link")

    // Arrange / Act
    const { collectionId } = await createCollectionViaWizard(page, {
      siteId,
      title: collectionTitle,
    })
    const { pageId } = await createCollectionPageViaWizard(page, {
      siteId,
      collectionId,
      title: pageTitle,
    })
    const editor = new PageEditorPO(page)
    await editor.clickPublish()
    await editor.expectPublishedToast()

    const { linkId } = await createCollectionLinkViaWizard(page, {
      siteId,
      collectionId,
      title: linkTitle,
    })
    const linkEditor = new CollectionLinkPO(page)
    await linkEditor.expectLoaded()
    await linkEditor.addExternalLink("example.com")
    await linkEditor.save()
    await editor.expectPublishButtonEnabled()
    await editor.clickPublish()
    await editor.expectPublishedToast()

    const indexPageId = await getIndexPageId(collectionId)
    await editor.gotoPage(siteId, indexPageId)
    await editor.clickPublish()
    await editor.expectPublishedToast()

    // Assert
    await expectResourceState(pageId).toBe(ResourceState.Published)
    await expectResourceState(linkId).toBe(ResourceState.Published)
    await expectResourceState(indexPageId).toBe(ResourceState.Published)

    const items = await getCollectionItemTitles(collectionId)
    expect(items.map((item) => item.title).sort()).toEqual(
      [linkTitle, pageTitle].sort(),
    )

    const dashboard = new DashboardPO(page)
    await dashboard.gotoCollection(siteId, collectionId)
    await dashboard.expectCollectionRowVisible(pageTitle)
    await dashboard.expectCollectionRowVisible(linkTitle)
  })
})
