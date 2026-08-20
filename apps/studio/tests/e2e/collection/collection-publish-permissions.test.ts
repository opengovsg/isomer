import { test } from "@playwright/test"
import { CollectionLinkPO } from "~e2e/fixtures/po"
import { PageEditorPO } from "~e2e/fixtures/po"
import {
  seedCollection,
  seedCollectionLink,
  seedCollectionWithPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { openCollectionIndexEditor } from "../fixtures/helpers"

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
