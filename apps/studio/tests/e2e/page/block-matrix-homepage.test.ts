import type { Page } from "@playwright/test"
import { test } from "@playwright/test"
import crypto from "crypto"
import { IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import {
  enableGrowthBookFeature,
  resetGrowthBookPage,
} from "~e2e/fixtures/network"
import { PageEditorPO } from "~e2e/fixtures/po"
import {
  seedCollectionWithPage,
  seedHomepageHero,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded, getE2EUserId } from "~e2e/fixtures/user"
import { ResourceState, RoleType } from "~prisma/generated/generatedEnums"

/**
 * Block matrix — Homepage/Root layout (PAGE_EDITOR_E2E_SPEC.md section 5).
 * Allowed blocks per `getHomepageAllowedBlocks` (`components/PageEditor/constants.ts`):
 * infocards, keystatistics, infocols, infopic, infobar, blockquote,
 * collectionblock, logocloud, antiscambanner (feature-flagged).
 *
 * A site only ever has one RootPage (`provisionE2ESite` creates it
 * automatically), so each test provisions its own site + calls
 * `seedHomepageHero` rather than sharing one Homepage page across tests —
 * keeps tests independent instead of racing/accumulating blocks on shared
 * mutable state.
 */

const openHomepageEditor = async (page: Page) => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  const { rootPageId } = await seedHomepageHero({ siteId: site.siteId })
  const editor = await openSeededPageEditor(page, site.siteId, rootPageId)
  return { siteId: site.siteId, editor }
}

/**
 * Blocks whose `DEFAULT_BLOCKS` entry (`components/PageEditor/constants.ts`)
 * is already a complete, schema-valid instance with placeholder text — add,
 * save with zero filling, reload, and the placeholder renders verbatim in
 * the preview iframe. `collectionblock` and `antiscambanner` need bespoke
 * handling (see the two dedicated tests below) so aren't in this table.
 */
const SIMPLE_HOMEPAGE_BLOCKS: { pickerLabel: string; previewText: string }[] = [
  { pickerLabel: "Cards", previewText: "Enter a title for your first card." },
  { pickerLabel: "Statistics", previewText: "Show growth numbers" },
  {
    pickerLabel: "Columns of text",
    previewText: "Enter a title for your first column.",
  },
  { pickerLabel: "Image with text", previewText: "Elaborate on the title." },
  {
    pickerLabel: "Call-to-Action",
    previewText: "Enter a strong message or call-to-action.",
  },
  { pickerLabel: "Quote", previewText: "Enter your quote here." },
  { pickerLabel: "Logo cloud", previewText: "Our partners" },
]

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  for (const { pickerLabel, previewText } of SIMPLE_HOMEPAGE_BLOCKS) {
    test(`${pickerLabel} block renders in the preview after save and reload`, async ({
      page,
    }) => {
      // Arrange
      const { editor } = await openHomepageEditor(page)

      // Act
      await editor.addBlockByLabel(pickerLabel)
      await editor.expectSaveBlockButtonEnabled()
      await editor.saveComplexBlock()
      await editor.reload()
      await editor.expectLoaded()

      // Assert
      await editor.expectPreviewContains(previewText)
    })
  }

  /**
   * `collectionblock`'s `DEFAULT_BLOCKS` entry deliberately leaves
   * `collectionReferenceLink` empty (a schema-required field that can't be
   * pre-filled without a real Collection to point at) — so this one needs a
   * seeded Collection, selecting it via the dropdown, before it's
   * schema-valid. It also needs a *published* Collection page: `CollectionBlock`
   * (`packages/components`) renders nothing if its collection has zero
   * published children, since the studio preview iframe's sitemap
   * (`getLocalisedSitemap`) only includes `Published` resources when listing
   * a collection's children.
   */
  test("collectionblock renders the selected collection's page after save and reload", async ({
    page,
  }) => {
    // Arrange
    const suffix = crypto.randomUUID().slice(0, 8)
    const collectionTitle = `E2E Homepage Collection ${suffix}`
    const collectionPageTitle = `E2E Homepage Collection Page ${suffix}`
    const { siteId, editor } = await openHomepageEditor(page)
    const adminUserId = await getE2EUserId(TEST_EMAILS.admin)
    await seedCollectionWithPage({
      siteId,
      collectionTitle,
      pageTitle: collectionPageTitle,
      state: ResourceState.Published,
      userId: adminUserId,
    })

    // Act
    await editor.addBlockByLabel("Link a Collection")
    await editor.selectCollection(collectionTitle)
    await editor.expectSaveBlockButtonEnabled()
    await editor.saveComplexBlock()
    await editor.reload()
    await editor.expectLoaded()

    // Assert
    await editor.expectPreviewContains(collectionPageTitle)
  })

  /**
   * `antiscambanner` only appears in the block picker behind the
   * `IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY` GrowthBook feature —
   * mirrors `fixtures/helpers.ts`'s `openCollectionIndexEditor` pattern
   * (mock the feature on, reset the GrowthBook page cache, *then* navigate).
   *
   * It's also the one block type `ComplexEditorStateDrawer`'s Save button
   * treats as non-editable after the fact (`isNonEditableBlock`) — Save is
   * only enabled in the single window right after it's added (while
   * `addedBlockIndex === currActiveIdx`), so this asserts that immediately,
   * with no intervening navigation, before saving.
   */
  test("antiscambanner can be added and saved while feature-flagged on, and renders in preview", async ({
    page,
  }) => {
    // Arrange
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    const { rootPageId } = await seedHomepageHero({ siteId: site.siteId })
    await enableGrowthBookFeature(
      page,
      IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY,
      true,
    )
    await resetGrowthBookPage(page)
    const editor = new PageEditorPO(page)
    await editor.gotoPage(site.siteId, rootPageId)
    await editor.expectLoaded()

    // Act
    await editor.addBlockByLabel("Anti-scam disclaimer")
    await editor.expectSaveBlockButtonEnabled()
    await editor.saveComplexBlock()
    await editor.reload()
    await editor.expectLoaded()

    // Assert
    await editor.expectPreviewContains(
      "Government officials will never ask you to transfer money over a phone call.",
    )
  })
})
