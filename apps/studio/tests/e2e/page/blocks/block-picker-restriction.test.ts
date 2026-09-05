import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import { seedArticlePage, seedFolderWithPage } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

/**
 * Exact picker labels for every block allowed on the Content layout
 * (`CONTENT_ALLOWED_BLOCKS`, `apps/studio/src/components/PageEditor/constants.ts`
 * ~481-500). `DATABASE_ALLOWED_BLOCKS` is literally the same array reference as
 * `CONTENT_ALLOWED_BLOCKS` (constants.ts ~507-508), so there is no
 * Database-specific allow-list to differentiate — this suite covers Article vs
 * Content only.
 */
const CONTENT_BLOCK_LABELS = [
  "Text",
  "Image",
  "Accordion",
  "Callout",
  "Quote",
  "Image gallery",
  "Map",
  "Video",
  "Image with text",
  "Call-to-Action",
  "Cards",
  "Columns of text",
  "Statistics",
  "FormSG",
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

  test("Article layout's block picker hides Content-only blocks and shows Article-allowed ones", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedArticlePage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act
    await editor.openAddBlockPicker()

    // Assert: "Statistics" (keystatistics) is valid on Content but not Article
    await editor.expectBlockPickerOptionHidden("Statistics")
    await editor.expectBlockPickerOptionVisible("Text")
    await editor.expectBlockPickerOptionVisible("Callout")
  })

  test("Content layout's block picker shows every block allowed on Content", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Act
    await editor.openAddBlockPicker()

    // Assert
    for (const label of CONTENT_BLOCK_LABELS) {
      await editor.expectBlockPickerOptionVisible(label)
    }
  })
})
