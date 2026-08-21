import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { fileURLToPath } from "url"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { getDraftIndexPage } from "~e2e/fixtures/collection"
import { openCollectionIndexEditor } from "~e2e/fixtures/helpers"
import {
  mockAssetUploadRoutes,
  mockPresignedPutUrl,
} from "~e2e/fixtures/network"
import { PageEditorPO } from "~e2e/fixtures/po"
import { seedCollection } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const LOGO_FIXTURE = fileURLToPath(
  new URL("../fixtures/e2e-logo.png", import.meta.url),
)
const LOGO_FILENAME = "e2e-logo.png"

let siteId: number
let indexPageId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
  const { indexPage } = await seedCollection({ siteId })
  indexPageId = indexPage.id
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.describe.configure({ mode: "serial" })

  test.beforeEach(async ({ page }) => {
    await mockAssetUploadRoutes(page)
    await mockPresignedPutUrl(page)
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

  test("collection display custom thumbnail persists after reload", async ({
    page,
  }) => {
    const alt = "A view of the collection's banner photograph from above"
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      indexPageId,
    )
    const editor = new PageEditorPO(page)

    // Arrange
    await collection.expectManageCollectionVisible()
    await collection.openCollectionDisplay()

    // Act
    await editor.uploadThumbnail(LOGO_FIXTURE, alt)
    await collection.saveCollectionDisplay()
    await collection.reload()
    await collection.expectManageCollectionVisible()
    await collection.openCollectionDisplay()

    // Assert
    await expect(editor.imageFilenameText(LOGO_FILENAME)).toBeVisible()
    await editor.expectFormFieldValue("Alternate text", alt)
  })
})
