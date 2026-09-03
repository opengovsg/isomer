import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  getResourceDraftBlobContent,
  SEEDED_PROSE_BLOCK_LABEL,
  seedRootPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

/**
 * Raw JSON Editor Mode is gated on the `IsomerAdmin` table (`Core`/`Migrator`
 * roles), a blanket admin bypass entirely separate from site-level
 * `RoleType`/`ResourcePermission` rows (`permissions.service.ts`'s
 * `isActiveIsomerAdmin`). `TEST_EMAILS.core` (see `godmode/access.test.ts`)
 * is pre-seeded as a real `IsomerAdmin` row and can open any freshly
 * provisioned site's page editor as a full admin, Raw JSON mode included —
 * no dedicated fixture/login helper is needed for it.
 */

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  // A site-level `RoleType.Admin` is not an `IsomerAdmin`-table Core/Migrator
  // user — this proves the gate checks the latter, not the former.
  test("site admin (not an Isomer admin) cannot activate Raw JSON mode via the combo", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E Raw JSON Gate Page ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.pressRawJsonEditorCombo()

    // Assert
    await editor.expectAtBlockListRoot()
    await editor.expectRawJsonEditorHidden()
  })
})

test.describe("core", { tag: roleTag("core") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.core)
  })

  test("Core Isomer admin can activate Raw JSON mode via the combo", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E Raw JSON Activate Page ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.pressRawJsonEditorCombo()

    // Assert
    await editor.expectRawJsonEditorVisible()
  })

  test("invalid JSON in Raw JSON mode disables Save and leaves the draft uncorrupted", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E Raw JSON Invalid Page ${crypto.randomUUID().slice(0, 8)}`,
    })
    const originalContent = await getResourceDraftBlobContent(seededPage.id)

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.pressRawJsonEditorCombo()
    await editor.expectRawJsonEditorVisible()
    await editor.fillRawJsonEditor("{ not valid json")

    // Assert
    await editor.expectRawJsonEditorSaveDisabled()

    // Act: reload without ever saving the invalid content
    await editor.reload()

    // Assert: prior valid content is untouched, both in the DB and the UI
    await editor.expectLoaded()
    await editor.expectBlockPreview(SEEDED_PROSE_BLOCK_LABEL)
    expect(await getResourceDraftBlobContent(seededPage.id)).toBe(
      originalContent,
    )
  })

  test("valid JSON edits in Raw JSON mode enable Save and persist after reload", async ({
    page,
  }) => {
    // Arrange
    const editedSummary = `Raw JSON summary ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({
      siteId,
      pageTitle: `E2E Raw JSON Valid Page ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.pressRawJsonEditorCombo()
    await editor.expectRawJsonEditorVisible()

    const currentJson = await editor.getRawJsonEditorValue()
    const parsed = JSON.parse(currentJson) as {
      page: { contentPageHeader: { summary: string } }
    }
    parsed.page.contentPageHeader.summary = editedSummary
    await editor.fillRawJsonEditor(JSON.stringify(parsed, null, 2))

    // Assert
    await editor.expectRawJsonEditorSaveEnabled()

    // Act
    await editor.saveRawJsonEditorChanges()
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await expect
      .poll(() => getResourceDraftBlobContent(seededPage.id))
      .toContain(editedSummary)
    await editor.openMetaSettings()
    await editor.expectFormFieldValue("Page summary", editedSummary)
  })
})
