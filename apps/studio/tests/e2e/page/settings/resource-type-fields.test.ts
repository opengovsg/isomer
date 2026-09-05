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
  seedDatabasePage,
  seedFolderIndexPage,
  seedHomepageHero,
  seedRootPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

// PAGE_EDITOR_E2E_SPEC.md item 3.2 — smoke-level check that each
// resource-type's editor loads a field/control that doesn't appear on other
// types. One test per row; Collection Page and Collection Link are
// intentionally omitted (already covered by
// `collection/edit-collection-page.test.ts` and
// `collection/edit-collection-link.test.ts`).

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("Standard/Content page's metadata drawer shows the Page summary field", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E Content Type ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openMetaSettings()

    // Assert
    await editor.expectMetaSettingsFieldVisible("Page summary")
  })

  test("Article page's metadata drawer shows the Article summary field", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedArticlePage({
      siteId,
      pageTitle: `E2E Article Type ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openMetaSettings()

    // Assert
    await editor.expectMetaSettingsFieldVisible("Article summary")
  })

  test("Database page's Database block opens DatabaseEditorStateDrawer, distinct from the metadata drawer", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedDatabasePage({
      siteId,
      pageTitle: `E2E Database Type ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openBlockEditor("Database")

    // Assert
    await editor.expectDatabaseEditorOpen()
  })

  test("Homepage shows the homepage-only Hero banner fixed block", async ({
    page,
  }) => {
    // Arrange
    const { rootPageId } = await seedHomepageHero({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, rootPageId)

    // Assert
    await editor.expectBlockPreview("Hero banner")
  })

  test("Folder Index page shows the Index-only siderail reorder control", async ({
    page,
  }) => {
    // Arrange
    const { indexPage } = await seedFolderIndexPage({
      siteId,
      folderTitle: `E2E Folder Index ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, indexPage.id)

    // Assert
    await editor.expectReorderSiderailVisible()
  })

  test("Collection Index page's drawer shows only the Summary field", async ({
    page,
  }) => {
    // Arrange
    const { indexPage } = await seedCollection({
      siteId,
      collectionTitle: `E2E Collection Index ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      indexPage.id,
    )
    await collection.openCollectionDisplay()

    // Assert
    await collection.expectCollectionSummaryFieldVisible()
  })
})
