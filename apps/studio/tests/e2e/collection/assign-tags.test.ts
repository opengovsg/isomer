import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import {
  createCollectionLink,
  createCollectionPage,
  createCollectionWithTagCategories,
} from "../fixtures/collection"
import { CollectionLinkPO } from "../fixtures/collection-link.po"
import { getRootPageId } from "../fixtures/collection.db"
import { CollectionPO } from "../fixtures/collection.po"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { getResourceDraftTagged } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const REQUIRED_CATEGORY_ID = "11111111-1111-4111-8111-111111111111"
const REQUIRED_OPTION_ID = "22222222-2222-4222-8222-222222222222"
const OPTIONAL_CATEGORY_ID = "33333333-3333-4333-8333-333333333333"
const OPTIONAL_OPTION_ID = "44444444-4444-4444-8444-444444444444"

let siteId: number
let collectionId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
  const collection = await createCollectionWithTagCategories(
    [
      {
        id: REQUIRED_CATEGORY_ID,
        label: "Topic",
        isRequired: true,
        options: [{ id: REQUIRED_OPTION_ID, label: "Technology" }],
      },
      {
        id: OPTIONAL_CATEGORY_ID,
        label: "Audience",
        isRequired: false,
        options: [{ id: OPTIONAL_OPTION_ID, label: "Public" }],
      },
    ],
    siteId,
  )
  collectionId = collection.collectionId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can assign required and optional tags on a collection page", async ({
    page,
  }) => {
    const collectionPage = await createCollectionPage({
      collectionId,
      siteId,
    })
    const collection = new CollectionPO(page)
    const editor = new PageEditorPO(page)

    // Arrange
    await editor.gotoPage(siteId, collectionPage.id)
    await collection.openArticleHeader()

    // Act
    await collection.selectTagOption("Topic", "Technology")
    await collection.selectTagOption("Audience", "Public")
    await collection.saveArticleHeaderChanges()

    // Assert
    const tagged = await getResourceDraftTagged(collectionPage.id)
    expect(tagged).toEqual(
      expect.arrayContaining([REQUIRED_OPTION_ID, OPTIONAL_OPTION_ID]),
    )
  })

  test("admin can assign required and optional tags on a collection link", async ({
    page,
  }) => {
    const rootPageId = await getRootPageId(siteId)
    const link = await createCollectionLink({
      collectionId,
      ref: `[resource:${siteId}:${rootPageId}]`,
      siteId,
    })
    const collection = new CollectionPO(page)
    const linkEditor = new CollectionLinkPO(page)

    // Arrange
    await linkEditor.gotoLink(siteId, link.id)
    await linkEditor.expectLoaded()
    await collection.expectItemSaveDisabled()
    await collection.expectRequiredTagError()

    // Act
    await collection.selectTagOption("Topic", "Technology")
    await collection.selectTagOption("Audience", "Public")
    await collection.expectItemSaveEnabled()
    await collection.saveCollectionLink()

    // Assert
    const tagged = await getResourceDraftTagged(link.id)
    expect(tagged).toEqual(
      expect.arrayContaining([REQUIRED_OPTION_ID, OPTIONAL_OPTION_ID]),
    )
  })
})
