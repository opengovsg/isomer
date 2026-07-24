import { test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { CollectionLinkPO } from "../fixtures/collection-link.po"
import { seedCollection, seedCollectionLink } from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number
let collectionId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
  const { collection } = await seedCollection({ siteId })
  collectionId = collection.id
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can edit collection link metadata and persist after reload", async ({
    page,
  }) => {
    const summary = `E2E link summary ${crypto.randomUUID().slice(0, 8)}`
    const linkText = "External resource"
    const linkEditor = new CollectionLinkPO(page)

    // Arrange
    const { collectionLink } = await seedCollectionLink({
      siteId,
      collectionId,
    })
    await linkEditor.gotoLink(siteId, collectionLink.id)
    await linkEditor.expectLoaded()

    // Act
    await linkEditor.fillSummary(summary)
    await linkEditor.addExternalLink(linkText, "example.com")
    await linkEditor.save()

    // Assert
    await linkEditor.reload()
    await linkEditor.expectLoaded()
    await linkEditor.expectSummary(summary)
    await linkEditor.expectExternalLinkButton(linkText)
  })
})
