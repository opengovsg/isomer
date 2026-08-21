import type { PageEditorPO } from "~e2e/fixtures/po"
import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import { seedArticlePage } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

/**
 * One test per block type allowed on the Article layout
 * (`ARTICLE_ALLOWED_BLOCKS`, `apps/studio/src/components/PageEditor/constants.ts`
 * ~466-479): prose, image, accordion, callout, blockquote, imagegallery, map,
 * video — 8 tests total.
 *
 * Every block type's `DEFAULT_BLOCKS[type]` entry (`constants.ts` ~5-304) is
 * already a complete, schema-valid instance with placeholder text/URLs
 * pre-filled — verified per-block against `expectSaveBlockButtonEnabled()`
 * while writing this file. So most cases are: add the block, confirm Save is
 * enabled, save with zero manual filling, reload, assert the default
 * placeholder renders in the preview iframe. Two exceptions:
 * - `prose` (picker label "Text") defaults to empty content
 *   (`DEFAULT_BLOCKS.prose.content[0].content[0].text === ""`) — handled as
 *   its own test via `addAndFillTextBlock`, which adds, fills, and saves in
 *   one call.
 * - `accordion`'s nested `details` prose field defaults to `content: []`,
 *   which fails that field's schema (`minItems: 1`) and leaves Save
 *   disabled — its case fills that field via `fillNestedProseContent` before
 *   saving.
 *
 * Each test seeds its own Article page so the 8 added-block scenarios stay
 * independent and failures are isolated.
 */
interface DefaultBlockCase {
  /** Exact block-picker label (`BLOCK_TO_META[type].label`). */
  label: string
  /** Fills any block-specific required field(s) beyond the schema-valid
   * default, then saves. A no-op body (just the Save-button check + save)
   * for every block whose default is already valid on its own. */
  addAndSave: (editor: PageEditorPO) => Promise<void>
  /** Asserts the saved block's default content renders in the preview
   * iframe after reload. */
  expectRendered: (editor: PageEditorPO) => Promise<void>
}

const DEFAULT_BLOCK_CASES: DefaultBlockCase[] = [
  {
    label: "Image",
    addAndSave: async (editor) => {
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: (editor) =>
      editor.expectPreviewImageVisible("Enter a descriptive alt text."),
  },
  {
    label: "Accordion",
    addAndSave: async (editor) => {
      await editor.fillNestedProseContent(
        "Accordion details for the e2e block matrix",
      )
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: (editor) =>
      editor.expectPreviewContains("Title for the accordion item"),
  },
  {
    label: "Callout",
    addAndSave: async (editor) => {
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: (editor) => editor.expectPreviewContains("Callout content"),
  },
  {
    label: "Quote",
    addAndSave: async (editor) => {
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: (editor) =>
      editor.expectPreviewContains("Enter your quote here."),
  },
  {
    label: "Image gallery",
    addAndSave: async (editor) => {
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: (editor) =>
      editor.expectPreviewRegionVisible("Image gallery"),
  },
  {
    label: "Map",
    addAndSave: async (editor) => {
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: (editor) =>
      editor.expectPreviewIframeTitle("Map of the Singapore region"),
  },
  {
    label: "Video",
    addAndSave: async (editor) => {
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
    },
    expectRendered: (editor) =>
      editor.expectPreviewVideoPlayButtonVisible(
        "Play video: Kit Chan sings 'Home' at NDP 2025",
      ),
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

  test("adding a Text block, saving, and reloading renders it in the Article preview", async ({
    page,
  }) => {
    // Arrange
    const text = `E2E article prose ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedArticlePage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act
    await editor.addAndFillTextBlock(text)
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectPreviewContains(text)
  })

  for (const { label, addAndSave, expectRendered } of DEFAULT_BLOCK_CASES) {
    test(`adding a ${label} block with its default content, saving, and reloading renders it in the Article preview`, async ({
      page,
    }) => {
      // Arrange
      const { page: seededPage } = await seedArticlePage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)

      // Act
      await editor.addBlockByLabel(label)
      await addAndSave(editor)
      await editor.reload()

      // Assert
      await editor.expectLoaded()
      await expectRendered(editor)
    })
  }
})
