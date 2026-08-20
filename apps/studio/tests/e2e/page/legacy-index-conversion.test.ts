import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  expectResourceDraftBlobContains,
  seedFolderLegacyContentIndexPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

// PAGE_EDITOR_E2E_SPEC.md item 4.1 — legacy custom-content Index Page
// conversion. A Folder's IndexPage can be stuck on a pre-migration
// `layout: "content"` (or other non-index/non-collection layout) shape,
// which `RootStateDrawer.tsx`'s `isCustomContentIndexPage` condition detects
// and offers to convert to the standard `layout: "index"` shape. Covers all
// 4 sub-paths: preview, keep old version, modal cancel, accept + save.

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("previewing the conversion shows the index-page layout without saving", async ({
    page,
  }) => {
    // Arrange
    const { indexPage } = await seedFolderLegacyContentIndexPage({
      siteId,
      folderTitle: `E2E Legacy Index Preview ${crypto.randomUUID().slice(0, 8)}`,
    })
    const editor = await openSeededPageEditor(page, siteId, indexPage.id)
    await editor.expectPreviewIndexPageConversionButtonVisible()

    // Act
    await editor.clickPreviewIndexPageConversion()

    // Assert
    await editor.expectReorderSiderailVisible()
    await editor.expectAcceptIndexPageConversionButtonVisible()
    await editor.expectKeepOldIndexPageVersionButtonVisible()
    await expectResourceDraftBlobContains(indexPage.id, '"layout":"content"')
  })

  test("keep old version reverts the preview, still without saving", async ({
    page,
  }) => {
    // Arrange
    const { indexPage } = await seedFolderLegacyContentIndexPage({
      siteId,
      folderTitle: `E2E Legacy Index Keep Old ${crypto.randomUUID().slice(0, 8)}`,
    })
    const editor = await openSeededPageEditor(page, siteId, indexPage.id)
    await editor.clickPreviewIndexPageConversion()
    await editor.expectAcceptIndexPageConversionButtonVisible()

    // Act
    await editor.clickKeepOldIndexPageVersion()

    // Assert
    await editor.expectPreviewIndexPageConversionButtonVisible()
    await expectResourceDraftBlobContains(indexPage.id, '"layout":"content"')
  })

  test("cancelling the confirm modal retains the preview state, unlike keep old version", async ({
    page,
  }) => {
    // Arrange
    const { indexPage } = await seedFolderLegacyContentIndexPage({
      siteId,
      folderTitle: `E2E Legacy Index Modal Cancel ${crypto.randomUUID().slice(0, 8)}`,
    })
    const editor = await openSeededPageEditor(page, siteId, indexPage.id)
    await editor.clickPreviewIndexPageConversion()
    await editor.clickAcceptIndexPageConversion()
    await editor.expectConfirmConvertIndexPageModalVisible()

    // Act
    await editor.cancelConvertIndexPageModal()

    // Assert
    await editor.expectConfirmConvertIndexPageModalHidden()
    await editor.expectAcceptIndexPageConversionButtonVisible()
    await editor.expectKeepOldIndexPageVersionButtonVisible()
    await expectResourceDraftBlobContains(indexPage.id, '"layout":"content"')
  })

  test("accepting the confirm modal converts and persists the index-page layout", async ({
    page,
  }) => {
    // Arrange
    const { indexPage } = await seedFolderLegacyContentIndexPage({
      siteId,
      folderTitle: `E2E Legacy Index Accept ${crypto.randomUUID().slice(0, 8)}`,
    })
    const editor = await openSeededPageEditor(page, siteId, indexPage.id)
    await editor.clickPreviewIndexPageConversion()
    await editor.clickAcceptIndexPageConversion()

    // Act
    await editor.acceptConvertIndexPageModal()

    // Assert
    await expectResourceDraftBlobContains(indexPage.id, '"layout":"index"')
    await editor.reload()
    await editor.expectLoaded()
    await editor.expectReorderSiderailVisible()
  })
})
