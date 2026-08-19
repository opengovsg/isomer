import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { getCollectionItemTitles, getIndexPageId } from "../fixtures/collection"
import { CollectionLinkPO } from "../fixtures/collection-link.po"
import { DashboardPO } from "../fixtures/dashboard.po"
import {
  createCollectionLinkViaWizard,
  createCollectionPageViaWizard,
  createCollectionViaWizard,
} from "../fixtures/helpers"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { getResource } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

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
    await expect
      .poll(async () => (await getResource(pageId))?.state)
      .toBe(ResourceState.Published)
    await expect
      .poll(async () => (await getResource(linkId))?.state)
      .toBe(ResourceState.Published)
    await expect
      .poll(async () => (await getResource(indexPageId))?.state)
      .toBe(ResourceState.Published)

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
