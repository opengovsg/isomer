import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { CollectionLinkPO } from "../fixtures/collection-link.po"
import { openCollectionIndexEditor } from "../fixtures/helpers"
import { PageEditorPO } from "../fixtures/page-editor.po"
import {
  seedCollection,
  seedCollectionLink,
  seedCollectionWithPage,
} from "../fixtures/page-seed"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number
let collectionId: string
let indexPageId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
  const seeded = await seedCollection({ siteId })
  collectionId = seeded.collection.id
  indexPageId = seeded.indexPage.id
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor sees a disabled Publish button on a collection page", async ({
    page,
  }) => {
    // Arrange
    const { collectionPage } = await seedCollectionWithPage({ siteId })
    const editor = new PageEditorPO(page)

    // Act
    await editor.gotoPage(siteId, collectionPage.id)

    // Assert
    await editor.expectPublishButtonDisabled()
  })

  test("editor sees a disabled Publish button on a collection link", async ({
    page,
  }) => {
    // Arrange
    const { collectionLink } = await seedCollectionLink({
      siteId,
      collectionId,
    })
    const linkEditor = new CollectionLinkPO(page)
    const editor = new PageEditorPO(page)

    // Act
    await linkEditor.gotoLink(siteId, collectionLink.id)

    // Assert
    await editor.expectPublishButtonDisabled()
  })

  test("editor sees a disabled Publish button on the collection index", async ({
    page,
  }) => {
    // Arrange / Act
    await openCollectionIndexEditor(page, siteId, indexPageId)
    const editor = new PageEditorPO(page)

    // Assert
    await editor.expectPublishButtonDisabled()
  })
})
