import type { PageEditorPO } from "~e2e/fixtures/po"
import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  SEEDED_PROSE_BLOCK_LABEL,
  seedFolderWithPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

/**
 * `blockquote` (picker label "Quote") is used as the non-prose block type here
 * instead of `callout`: its required fields (`Quote`, `Source`) are plain
 * text/textarea FormBuilder controls, unlike `callout`'s rich-text `content`
 * field — simpler and more robust to fill generically.
 */
const addAndSaveBlockquote = async (
  editor: PageEditorPO,
  quote: string,
  source: string,
) => {
  await editor.addBlockByLabel("Quote")
  await editor.fillFormFieldByLabel("Quote", quote)
  await editor.fillFormFieldByLabel("Source", source)
  await editor.saveComplexBlock()
}

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can add, reorder, edit, and delete blocks, each change persisting after reload", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const proseTextA = `E2E Block A ${suffix}`
    const quoteB = `E2E Block B quote ${suffix}`
    const sourceB = `E2E Block B source ${suffix}`
    const editedSourceB = `E2E Block B source edited ${suffix}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act: add block A (prose), then block B (blockquote) — both persist via
    // their own per-block save.
    await editor.addAndFillTextBlock(proseTextA)
    await addAndSaveBlockquote(editor, quoteB, sourceB)
    await editor.reload()

    // Assert: both persisted, in insertion order A, B
    await editor.expectLoaded()
    await editor.expectBlockOrder([proseTextA, quoteB])

    // Act: reorder — move A below B. Reordering persists immediately via its
    // own mutation (no separate page-level save).
    await editor.reorderBlockDown(proseTextA)
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectBlockOrder([quoteB, proseTextA])

    // Act: edit block B's content
    await editor.openBlockEditor(quoteB)
    await editor.fillFormFieldByLabel("Source", editedSourceB)
    await editor.saveComplexBlock()
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.openBlockEditor(quoteB)
    await editor.expectFormFieldValue("Source", editedSourceB)
    await editor.clickDrawerBack()

    // Act: delete block A (now second) — deletion also persists immediately
    await editor.openBlockEditor(proseTextA)
    await editor.openDeleteBlockModal()
    await editor.confirmDeleteBlock()
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectBlockAbsent(proseTextA)
  })

  test("canceling a block's delete confirmation leaves the block in place", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openBlockEditor(SEEDED_PROSE_BLOCK_LABEL)
    await editor.openDeleteBlockModal()

    // Act
    await editor.cancelDeleteBlock()

    // Assert
    await editor.expectBlockPreview(SEEDED_PROSE_BLOCK_LABEL)
  })
})
