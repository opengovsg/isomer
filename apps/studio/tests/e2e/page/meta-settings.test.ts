import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { E2E_LOGO_FILENAME, E2E_LOGO_FIXTURE } from "~e2e/fixtures/assets"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import {
  openCollectionIndexEditor,
  openSeededPageEditor,
} from "~e2e/fixtures/helpers"
import {
  mockAssetUploadRoutes,
  mockPresignedPutUrl,
} from "~e2e/fixtures/network"
import {
  seedArticlePage,
  seedCollection,
  seedDatabasePage,
  seedFolderIndexPage,
  seedRootPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const LOGO_FIXTURE = E2E_LOGO_FIXTURE
const LOGO_FILENAME = E2E_LOGO_FILENAME

// In-editor page-header drawer (`MetadataEditorStateDrawer`) via
// `PageEditorPO.openMetaSettings()` — not the top-nav SEO route
// (`seo-meta-settings.test.ts`) and not the dashboard PageSettingsModal.
// Tagged filters on Article only render for Collection items (see
// `JsonFormsTaggedControl`); that path is covered by
// `collection/assign-tags.test.ts`.

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async ({ page }) => {
    await mockAssetUploadRoutes(page)
    await mockPresignedPutUrl(page)
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("Content layout: summary, button label, and button destination persist after reload", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const summary = `E2E content summary ${suffix}`
    const buttonLabel = `E2E button label ${suffix}`
    const buttonUrl = `example-${suffix}.com`
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E Meta Settings Content Page ${suffix}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openMetaSettings()
    await editor.fillFormFieldByLabel("Page summary", summary)
    await editor.fillFormFieldByLabel("Button label", buttonLabel)
    await editor.fillButtonDestination(buttonUrl)
    await editor.saveMetaSettings()
    await editor.reload()
    await editor.expectLoaded()
    await editor.openMetaSettings()

    // Assert
    await editor.expectFormFieldValue("Page summary", summary)
    await editor.expectFormFieldValue("Button label", buttonLabel)
    await editor.expectButtonDestinationHref(`https://${buttonUrl}`)
  })

  test("Article layout: summary persists after reload", async ({ page }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const summary = `E2E article summary ${suffix}`
    const { page: seededPage } = await seedArticlePage({
      siteId,
      pageTitle: `E2E Meta Settings Article Page ${suffix}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openMetaSettings()
    await editor.fillFormFieldByLabel("Article summary", summary)
    await editor.saveMetaSettings()
    await editor.reload()
    await editor.expectLoaded()
    await editor.openMetaSettings()

    // Assert
    await editor.expectFormFieldValue("Article summary", summary)
  })

  test("Collection layout: summary persists after reload", async ({ page }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const summary = `E2E collection summary ${suffix}`
    const { indexPage } = await seedCollection({
      siteId,
      collectionTitle: `E2E Meta Settings Collection ${suffix}`,
    })

    // Act
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      indexPage.id,
    )
    await collection.expectManageCollectionVisible()
    await collection.openCollectionDisplay()
    await collection.fillCollectionSummary(summary)
    await collection.saveCollectionDisplay()
    await collection.reload()
    await collection.expectManageCollectionVisible()
    await collection.openCollectionDisplay()

    // Assert
    await collection.expectCollectionSummary(summary)
  })

  test("Content layout: Save is disabled while the required summary is empty, re-enabled once refilled", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E Meta Settings Disabled Save Page ${suffix}`,
    })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openMetaSettings()

    // Act
    await editor.fillFormFieldByLabel("Page summary", "")

    // Assert
    await editor.expectSaveMetaSettingsDisabled()

    // Act
    await editor.fillFormFieldByLabel(
      "Page summary",
      `E2E refilled summary ${suffix}`,
    )

    // Assert
    await editor.expectSaveMetaSettingsEnabled()
  })

  test("Content layout: page thumbnail persists after reload", async ({
    page,
  }) => {
    // Arrange
    const alt = "A view of the site's landing page from above"
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E Thumbnail Content ${crypto.randomUUID().slice(0, 8)}`,
    })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act
    await editor.openMetaSettings()
    await editor.uploadThumbnail(LOGO_FIXTURE, alt)
    await editor.saveMetaSettings()
    await editor.reload()
    await editor.expectLoaded()
    await editor.openMetaSettings()

    // Assert
    await expect(editor.imageFilenameText(LOGO_FILENAME)).toBeVisible()
    await editor.expectFormFieldValue("Alternate text", alt)
  })

  test("Article layout: article date and thumbnail persist after reload", async ({
    page,
  }) => {
    // Arrange
    const date = "21/08/2026"
    const alt = "A view of the article's hero photograph from the archive"
    const { page: seededPage } = await seedArticlePage({
      siteId,
      pageTitle: `E2E Article Date ${crypto.randomUUID().slice(0, 8)}`,
    })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act
    await editor.openMetaSettings()
    await editor.fillArticleDate(date)
    await editor.uploadThumbnail(LOGO_FIXTURE, alt)
    await editor.saveMetaSettings()
    await editor.reload()
    await editor.expectLoaded()
    await editor.openMetaSettings()

    // Assert
    await editor.expectArticleDate(date)
    await expect(editor.imageFilenameText(LOGO_FILENAME)).toBeVisible()
    await editor.expectFormFieldValue("Alternate text", alt)
  })

  test("Index layout: summary, button label, and button destination persist after reload", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const summary = `E2E index summary ${suffix}`
    const buttonLabel = `E2E index button ${suffix}`
    const buttonUrl = `example-index-${suffix}.com`
    const { indexPage } = await seedFolderIndexPage({
      siteId,
      folderTitle: `E2E Index Header ${suffix}`,
    })
    const editor = await openSeededPageEditor(page, siteId, indexPage.id)

    // Act
    await editor.openMetaSettings()
    await editor.fillFormFieldByLabel("Page summary", summary)
    await editor.fillFormFieldByLabel("Button label", buttonLabel)
    await editor.fillButtonDestination(buttonUrl)
    await editor.saveMetaSettings()
    await editor.reload()
    await editor.expectLoaded()
    await editor.openMetaSettings()

    // Assert
    await editor.expectFormFieldValue("Page summary", summary)
    await editor.expectFormFieldValue("Button label", buttonLabel)
    await editor.expectButtonDestinationHref(`https://${buttonUrl}`)
  })

  test("Database layout: page-header summary, button label, and destination persist after reload", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const summary = `E2E database summary ${suffix}`
    const buttonLabel = `E2E database button ${suffix}`
    const buttonUrl = `example-db-${suffix}.com`
    const { page: seededPage } = await seedDatabasePage({
      siteId,
      pageTitle: `E2E Database Header ${suffix}`,
    })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act
    await editor.openMetaSettings()
    await editor.fillFormFieldByLabel("Page summary", summary)
    await editor.fillFormFieldByLabel("Button label", buttonLabel)
    await editor.fillButtonDestination(buttonUrl)
    await editor.saveMetaSettings()
    await editor.reload()
    await editor.expectLoaded()
    await editor.openMetaSettings()

    // Assert
    await editor.expectFormFieldValue("Page summary", summary)
    await editor.expectFormFieldValue("Button label", buttonLabel)
    await editor.expectButtonDestinationHref(`https://${buttonUrl}`)
  })
})
