import type { PageEditorPO } from "~e2e/fixtures/po"
import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import { seedFolderWithPage } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

/**
 * Full block matrix for the Content (Standard) page layout
 * (`CONTENT_ALLOWED_BLOCKS`, `apps/studio/src/components/PageEditor/constants.ts`
 * ~481-500) — item 5 (Content row) of `PAGE_EDITOR_E2E_SPEC.md`'s block
 * matrix. One test per block type: add it via the picker, save, reload, and
 * assert it renders in the preview iframe.
 *
 * `ComponentSelector.tsx`'s `onProceed` seeds every newly-added block
 * directly from `DEFAULT_BLOCKS[type]` (`constants.ts` ~5-304) — for almost
 * every type this is already a complete, schema-valid instance (placeholder
 * image src/alt, array fields like `infocards`/`infocols`/`keystatistics`
 * pre-filled with 3+ items satisfying `minItems`), so most cases below need
 * zero manual filling before Save. Two exceptions found by reading the
 * schemas directly (`packages/components/src/interfaces/complex/*.ts`,
 * `packages/components/src/interfaces/native/Prose.ts`):
 *
 * - `prose`: `DEFAULT_BLOCKS.prose` has empty text — uses the existing
 *   `addAndFillTextBlock` helper instead of the table below.
 * - `accordion`: `DEFAULT_BLOCKS.accordion.details.content` is `[]`, but
 *   `AccordionProseSchema` (`Prose.ts` ~82-85, `isRequired: true`) requires
 *   `minItems: 1` on that array — Save is genuinely disabled until the
 *   details field is filled in, unlike every other block here.
 */

interface BlockMatrixCase {
  name: string
  pickerLabel: string
  /** Runs after the block has been added, before Save is asserted/clicked —
   * only `accordion` needs this; every other case is a no-op. */
  fillBeforeSave: (editor: PageEditorPO, detailText: string) => Promise<void>
  assertRendered: (editor: PageEditorPO, detailText: string) => Promise<void>
}

const NOOP: BlockMatrixCase["fillBeforeSave"] = async () => {
  // No manual filling needed — `DEFAULT_BLOCKS` is already schema-valid.
}

const CONTENT_BLOCK_MATRIX_CASES: BlockMatrixCase[] = [
  {
    name: "image",
    pickerLabel: "Image",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      await editor.expectPreviewImageVisible("Enter a descriptive alt text.")
    },
  },
  {
    name: "accordion",
    pickerLabel: "Accordion",
    // `details.content` starts as `[]`, which violates `AccordionProseSchema`'s
    // `minItems: 1` — Save is disabled until this nested prose field has content.
    fillBeforeSave: async (editor, detailText) => {
      await editor.fillNestedProseContent(detailText)
    },
    assertRendered: async (editor) => {
      // The accordion's `<details>` starts closed, so only the always-visible
      // `<summary>` (the default `summary` text) is checked — the filled-in
      // `details` content is hidden until the disclosure is expanded, which
      // is out of scope for this smoke-level render check.
      await editor.expectPreviewContains("Title for the accordion item")
    },
  },
  {
    name: "callout",
    pickerLabel: "Callout",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      // `exact: true` — the seeded page's own pre-existing callout block
      // (`setupBlob`'s default content) reads "Test Callout content", which
      // contains this block's default "Callout content" as a literal
      // substring. A non-exact match would resolve to both blocks' paragraphs
      // and violate Playwright's strict mode.
      await editor.expectPreviewContains("Callout content", { exact: true })
    },
  },
  {
    name: "blockquote",
    pickerLabel: "Quote",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      await editor.expectPreviewContains("Enter your quote here.")
    },
  },
  {
    name: "contentpic",
    pickerLabel: "Image with text",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      await editor.expectPreviewContains(
        "Enter content to place beside the image.",
      )
      await editor.expectPreviewImageVisible(
        "Describe what the image is about.",
      )
    },
  },
  {
    name: "infobar",
    pickerLabel: "Call-to-Action",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      await editor.expectPreviewContains(
        "Enter a strong message or call-to-action.",
      )
    },
  },
  {
    name: "imagegallery",
    pickerLabel: "Image gallery",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      // The 3 default images share identical placeholder `alt`/`caption`
      // text, further duplicated across the main slideshow and thumbnail
      // strip (`ImageGalleryClient.tsx`) — text/role-based matching on those
      // would violate strict mode. The outer region landmark uniquely proves
      // the block rendered.
      await editor.expectPreviewRegionVisible("Image gallery")
    },
  },
  {
    name: "infocards",
    pickerLabel: "Cards",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      await editor.expectPreviewContains("Enter a title.")
      await editor.expectPreviewContains("Enter a title for your first card.")
    },
  },
  {
    name: "infocols",
    pickerLabel: "Columns of text",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      await editor.expectPreviewContains("Enter a title.")
      await editor.expectPreviewContains("Enter a title for your first column.")
    },
  },
  {
    name: "keystatistics",
    pickerLabel: "Statistics",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      await editor.expectPreviewContains("Enter a title.")
      await editor.expectPreviewContains("Enter a label for each item.")
    },
  },
  {
    name: "map",
    pickerLabel: "Map",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      await editor.expectPreviewIframeTitle("Map of the Singapore region")
    },
  },
  {
    name: "video",
    pickerLabel: "Video",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      // `video`'s YouTube embed is lazy-activated (`LiteYouTubeEmbed.tsx`):
      // the real `<iframe title=...>` only mounts after the placeholder is
      // clicked. Asserting on the placeholder button's accessible name
      // instead proves the block rendered with the correct title without
      // depending on an actual external video load.
      await editor.expectPreviewVideoPlayButtonVisible(
        "Play video: Kit Chan sings 'Home' at NDP 2025",
      )
    },
  },
  {
    name: "formsg",
    pickerLabel: "FormSG",
    fillBeforeSave: NOOP,
    assertRendered: async (editor) => {
      await editor.expectPreviewIframeTitle(
        "Fill in a sample feedback form for Isomer.",
      )
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

  test("prose block renders its own text in the preview after save and reload", async ({
    page,
  }) => {
    // Arrange
    const text = `E2E Block Matrix Prose ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act
    await editor.addAndFillTextBlock(text)
    await editor.reload()
    await editor.expectLoaded()

    // Assert
    await editor.expectPreviewContains(text)
  })

  for (const testCase of CONTENT_BLOCK_MATRIX_CASES) {
    test(`${testCase.name} block renders its default content in the preview after save and reload`, async ({
      page,
    }) => {
      // Arrange
      const detailText = `E2E Block Matrix ${testCase.name} detail ${crypto.randomUUID().slice(0, 8)}`
      const { page: seededPage } = await seedFolderWithPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, seededPage.id)

      // Act
      await editor.addBlockByLabel(testCase.pickerLabel)
      await testCase.fillBeforeSave(editor, detailText)
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
      await editor.reload()
      await editor.expectLoaded()

      // Assert
      await testCase.assertRendered(editor, detailText)
    })
  }
})
