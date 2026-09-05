import type { PageEditorPO } from "~e2e/fixtures/po"
import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  DEFAULT_CALLOUT_BLOCK_LABEL,
  seedFolderIndexPage,
  seedPageInFolder,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded, getE2EUserId } from "~e2e/fixtures/user"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

/**
 * PAGE_EDITOR_E2E_SPEC.md item 5 (Index row of the block matrix). Index's
 * `INDEX_ALLOWED_BLOCKS` (`apps/studio/src/components/PageEditor/constants.ts`
 * ~502-505) is `childrenpages` plus a literal spread of `CONTENT_ALLOWED_BLOCKS`
 * — the same 14-block array `block-matrix-content.test.ts` already covers in
 * full against a Content-layout page. Repeating all 14 here would just be the
 * identical add/save/reload/preview mechanics against a differently-labeled
 * page — not additional coverage.
 *
 * This file instead covers, in full:
 * - `childrenpages` ("Child pages") — the one block unique to Index, not
 *   exercised anywhere else in the suite. It needs its own bespoke arrange
 *   (a folder with a *published* sibling page — see the test for why) rather
 *   than the shared table below.
 *
 * ...plus a small spot check (not full coverage) that the shared add-block
 * mechanics — already proven per-block by `block-matrix-content.test.ts` —
 * still work identically on an Index-layout page:
 * - `prose`: native TipTap editor, distinct save path from complex blocks.
 * - `callout`: complex block whose default content is already schema-valid
 *   (`DEFAULT_BLOCKS.callout`, constants.ts ~35-51) — zero manual filling.
 */
const PROSE_TEXT = `E2E Index prose ${crypto.randomUUID().slice(0, 8)}`

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
      await editor.expectPreviewContains(DEFAULT_CALLOUT_BLOCK_LABEL)
    },
  },
]

let siteId: number
let adminUserId: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
  adminUserId = await getE2EUserId(TEST_EMAILS.admin)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can add a Child pages block that renders links to the folder's published child pages", async ({
    page,
  }) => {
    // Arrange: an Index page seeded WITHOUT a pre-existing `childrenpages`
    // block — the picker disables "Child pages" once the page already has a
    // non-hidden one (`ComponentSelector.tsx`'s `isDisabled` check) — plus a
    // Published sibling page under the same folder. The live preview's
    // sitemap query (`getLocalisedSitemap`'s `immediateSiblings` CTE) only
    // includes Published resources, so a Draft child page would render
    // nothing here.
    const suffix = crypto.randomUUID().slice(0, 8)
    const { folder, indexPage } = await seedFolderIndexPage({
      siteId,
      folderTitle: `E2E Index Childrenpages ${suffix}`,
      content: [],
    })
    const childPageTitle = `E2E Index Child Page ${suffix}`
    await seedPageInFolder({
      siteId,
      folderId: folder.id,
      pageTitle: childPageTitle,
      state: ResourceState.Published,
      userId: adminUserId,
    })
    const editor = await openSeededPageEditor(page, siteId, indexPage.id)

    // Act: `DEFAULT_CHILDREN_PAGES_BLOCK` (variant "rows", showSummary true,
    // showThumbnail false, empty ordering) is already fully valid — nothing
    // to fill before saving.
    await editor.addBlockByLabel("Child pages")
    await editor.expectSaveBlockButtonEnabled()
    await editor.saveComplexBlock()
    await editor.reload()

    // Assert
    await editor.expectLoaded()
    await editor.expectPreviewChildPageLink(childPageTitle)
  })

  for (const { name, addAndSave, expectRendered } of BLOCK_MATRIX_CASES) {
    test(`admin can add a ${name} block on an Index page, save, reload, and see it rendered in the preview`, async ({
      page,
    }) => {
      // Arrange
      const { indexPage } = await seedFolderIndexPage({ siteId })
      const editor = await openSeededPageEditor(page, siteId, indexPage.id)

      // Act
      await addAndSave(editor)
      await editor.reload()

      // Assert
      await editor.expectLoaded()
      await expectRendered(editor)
    })
  }
})
