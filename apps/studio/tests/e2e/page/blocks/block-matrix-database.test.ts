import type { PageEditorPO } from "~e2e/fixtures/po"
import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import { seedDatabasePage } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

/**
 * `DATABASE_ALLOWED_BLOCKS` is literally the same array reference as
 * `CONTENT_ALLOWED_BLOCKS` (`apps/studio/src/components/PageEditor/constants.ts`
 * ~507-508) — Database has no allow-list of its own, so the block-ADD/render
 * mechanics for every one of the 14 Content-allowed block types are identical
 * on a Database-layout page. `block-matrix-content.test.ts` already covers the
 * full 14-block matrix; repeating it verbatim here would be pure duplication.
 *
 * This file instead covers a small, representative sample to prove the
 * mechanics (add -> save -> reload -> render in preview) hold on the
 * Database layout specifically, picking one block from each shape of
 * required-field handling:
 * - `prose`: native TipTap editor, distinct save path from complex blocks.
 * - `callout`: complex block whose default content is already schema-valid
 *   (`DEFAULT_BLOCKS.callout`, constants.ts ~35-51) — zero manual filling.
 * - `image`: complex block with a validated `alt` field
 *   (`AltTextSchema`/`ALT_TEXT_REGEX_PATTERN`, `Image.ts`) — filled manually
 *   to avoid depending on whether the seeded default alt text satisfies the
 *   pattern (see `block-validation.test.ts`, which treats a freshly-added
 *   Image block as needing its alt text filled in).
 * - `infocards`: array-based complex block whose default `cards` are already
 *   schema-valid (`DEFAULT_BLOCKS.infocards`, constants.ts ~75-104) — zero
 *   manual filling.
 */
const PROSE_TEXT = `E2E Database prose ${crypto.randomUUID().slice(0, 8)}`
const IMAGE_ALT_TEXT = `E2E Database image alt ${crypto.randomUUID().slice(0, 8)}`

interface BlockMatrixCase {
  name: string
  addAndSave: (editor: PageEditorPO) => Promise<void>
  expectRendered: (editor: PageEditorPO) => Promise<void>
}

const BLOCK_MATRIX_CASES: BlockMatrixCase[] = [
  {
    name: "prose",
    addAndSave: async (editor) => {
      await editor.addAndFillTextBlock(PROSE_TEXT)
    },
    expectRendered: async (editor) => {
      await editor.expectPreviewContains(PROSE_TEXT)
    },
  },
  {
    name: "callout",
    addAndSave: async (editor) => {
      await editor.addBlockByLabel("Callout")
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: async (editor) => {
      await editor.expectPreviewContains("Callout content")
    },
  },
  {
    name: "image",
    addAndSave: async (editor) => {
      await editor.addBlockByLabel("Image")
      await editor.fillFormFieldByLabel("Alternate text", IMAGE_ALT_TEXT)
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: async (editor) => {
      await editor.expectPreviewImageVisible(IMAGE_ALT_TEXT)
    },
  },
  {
    name: "infocards",
    addAndSave: async (editor) => {
      await editor.addBlockByLabel("Cards")
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: async (editor) => {
      await editor.expectPreviewContains("Enter a title for your first card.")
    },
  },
]

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  for (const { name, addAndSave, expectRendered } of BLOCK_MATRIX_CASES) {
    test(`admin can add a ${name} block on a Database page, save, reload, and see it rendered in the preview`, async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedDatabasePage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)

      // Act
      await addAndSave(editor)
      await editor.reload()

      // Assert
      await editor.expectLoaded()
      await expectRendered(editor)
    })
  }
})
