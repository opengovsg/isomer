import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import {
  openCollectionIndexEditor,
  openSeededPageEditor,
} from "~e2e/fixtures/helpers"
import {
  seedArticlePage,
  seedCollection,
  seedRootPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

// Meta Settings persistence (PAGE_EDITOR_E2E_SPEC.md 3.1). Reaches
// `MetadataEditorStateDrawer` via `PageEditorPO.openMetaSettings()`'s
// layout-specific "page header" block — see that method's doc comment for
// why this isn't the top-nav "Meta Settings" tab. The Collection-layout case
// below is a different surface (`CollectionEditorStateDrawer`'s "Collection
// display"): `MetadataEditorStateDrawer`'s Collection branch (subtitle-only
// schema) is unreachable from any UI path today, so this instead exercises
// the actual UI editors would use to set a Collection Index's summary.

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
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
})
