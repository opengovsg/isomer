import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { getDraftIndexPage } from "../fixtures/collection"
import { openCollectionIndexEditor } from "../fixtures/helpers"
import { seedCollection } from "../fixtures/page-seed"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number
let indexPageId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
  const { indexPage } = await seedCollection({ siteId })
  indexPageId = indexPage.id
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("collection display options persist after save and reload", async ({
    page,
  }) => {
    const summary = `E2E display summary ${crypto.randomUUID().slice(0, 8)}`
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      indexPageId,
    )

    // Arrange
    await collection.expectManageCollectionVisible()
    await collection.openCollectionDisplay()

    // Act
    await collection.fillCollectionSummary(summary)
    await collection.chooseLayout("2-column")
    await collection.chooseSortOrder("By title, A → Z")
    await collection.setShowDate(false)
    await collection.enableThumbnails("Use first image")
    await collection.saveCollectionDisplay()
    await collection.reload()
    await collection.expectManageCollectionVisible()
    await collection.openCollectionDisplay()

    // Assert
    await collection.expectCollectionSummary(summary)
    await collection.expectLayoutSelected("2-column")
    const draft = await getDraftIndexPage(indexPageId)
    expect(draft?.subtitle).toBe(summary)
    expect(draft?.variant).toBe("blog")
    expect(draft?.sortOrder).toBe("title-asc")
    expect(draft?.showDate).toBe(false)
    expect(draft?.showThumbnail?.fallback).toBe("first-image")
  })
})
