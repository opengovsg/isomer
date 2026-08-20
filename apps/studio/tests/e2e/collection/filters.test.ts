import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT } from "~/schemas/collection"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import {
  createCollectionPage,
  createCollectionWithTagCategories,
} from "../fixtures/collection"
import { getDraftIndexPage } from "../fixtures/collection.db"
import { openCollectionIndexEditor } from "../fixtures/helpers"
import { failTagOptionsUsageCount } from "../fixtures/network"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { seedCollection } from "../fixtures/page-seed"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const option = (label: string) => ({
  id: crypto.randomUUID(),
  label,
})

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can add a required filter with options, save, and reload", async ({
    page,
  }) => {
    const { indexPage } = await seedCollection({ siteId })
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      indexPage.id,
    )

    // Arrange
    await collection.expectManageCollectionVisible()
    await collection.openFilters()
    await collection.expectManageFiltersDrawerOpen()

    // Act
    await collection.addFilter()
    await collection.openFilterNamed("New filter")
    await collection.fillFilterName("Topic")
    await collection.setFilterRequired(true)
    await collection.chooseFilterPresentation("Plaintext")
    await collection.addOption()
    await collection.renameOptionAtIndex(0, "Technology")
    await collection.addOption()
    await collection.renameOptionAtIndex(1, "Policy")
    await collection.saveFilters()
    await collection.reload()
    await collection.expectManageCollectionVisible()
    await collection.openFilters()
    await collection.openFilterNamed("Topic")

    // Assert
    await collection.expectRequiredChecked(true)
    await collection.expectFilterPresentationSelected("Plaintext")
    await collection.expectOptionNamedVisible("Technology")
    await collection.expectOptionNamedVisible("Policy")
    const draft = await getDraftIndexPage(indexPage.id)
    expect(draft?.tagCategories?.[0]?.label).toBe("Topic")
    expect(draft?.tagCategories?.[0]?.isRequired).toBe(true)
    expect(draft?.tagCategories?.[0]?.display).toBe("plaintext")
    expect(
      draft?.tagCategories?.[0]?.options.map((item) => item.label),
    ).toEqual(["Technology", "Policy"])
  })

  test("admin can edit filter and option names", async ({ page }) => {
    const seeded = await createCollectionWithTagCategories(
      [
        {
          id: crypto.randomUUID(),
          label: "Old filter",
          isRequired: false,
          options: [option("Old option")],
        },
      ],
      siteId,
    )
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      seeded.indexPageId,
    )

    // Arrange
    await collection.openFilters()
    await collection.openFilterNamed("Old filter")

    // Act
    await collection.fillFilterName("Renamed filter")
    await collection.renameOptionAtIndex(0, "Renamed option")
    await collection.returnToFilters()

    // Assert
    await collection.expectFilterNamedVisible("Renamed filter")
    await collection.openFilterNamed("Renamed filter")
    await collection.expectOptionNamedVisible("Renamed option")
  })

  test("admin can reorder filters", async ({ page }) => {
    const seeded = await createCollectionWithTagCategories(
      [
        {
          id: crypto.randomUUID(),
          label: "First filter",
          isRequired: false,
          options: [option("A")],
        },
        {
          id: crypto.randomUUID(),
          label: "Second filter",
          isRequired: false,
          options: [option("B")],
        },
      ],
      siteId,
    )
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      seeded.indexPageId,
    )

    // Arrange
    await collection.openFilters()
    await collection.expectFilterOrder(["First filter", "Second filter"])

    // Act
    await collection.reorderFirstFilterDown()
    await collection.saveFilters()

    // Assert
    const draft = await getDraftIndexPage(seeded.indexPageId)
    expect(draft?.tagCategories?.map((category) => category.label)).toEqual([
      "Second filter",
      "First filter",
    ])
  })

  test("admin can reorder options", async ({ page }) => {
    const seeded = await createCollectionWithTagCategories(
      [
        {
          id: crypto.randomUUID(),
          label: "Topic",
          isRequired: false,
          options: [option("First option"), option("Second option")],
        },
      ],
      siteId,
    )
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      seeded.indexPageId,
    )

    // Arrange
    await collection.openFilters()
    await collection.openFilterNamed("Topic")
    await collection.expectOptionOrder(["First option", "Second option"])

    // Act
    await collection.reorderFirstOptionDown()
    await collection.saveFilters()

    // Assert
    const draft = await getDraftIndexPage(seeded.indexPageId)
    expect(
      draft?.tagCategories?.[0]?.options.map((item) => item.label),
    ).toEqual(["Second option", "First option"])
  })

  test("duplicate filter names show a validation error", async ({ page }) => {
    const { indexPage } = await seedCollection({ siteId })
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      indexPage.id,
    )

    // Arrange
    await collection.openFilters()
    await collection.addFilter()
    await collection.addFilter()

    // Act / Assert — live caption; drawer Save stays enabled because duplicates
    // are not AJV errors.
    await collection.expectFilterNameError(
      "A filter with this name already exists.",
    )
  })

  test("blank filter names disable drawer save", async ({ page }) => {
    const { indexPage } = await seedCollection({ siteId })
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      indexPage.id,
    )

    // Arrange
    await collection.openFilters()
    await collection.addFilter()
    await collection.openFilterNamed("New filter")

    // Act
    await collection.fillFilterName("")

    // Assert
    await collection.expectDrawerSaveDisabled()
  })

  test("duplicate option names show a validation error", async ({ page }) => {
    const { indexPage } = await seedCollection({ siteId })
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      indexPage.id,
    )

    // Arrange
    await collection.openFilters()
    await collection.addFilter()
    await collection.openFilterNamed("New filter")
    await collection.fillFilterName("Topic")
    await collection.addOption()
    await collection.addOption()
    await collection.renameOptionAtIndex(0, "Same name")
    await collection.openOptionInlineEdit(1)

    // Act
    await collection.fillOptionName(1, "Same name")

    // Assert
    await collection.expectOptionNameError(
      "An option with this name already exists.",
    )
    await collection.expectInlineOptionSaveDisabled()
  })

  test("blank option names show a validation error", async ({ page }) => {
    const { indexPage } = await seedCollection({ siteId })
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      indexPage.id,
    )

    // Arrange
    await collection.openFilters()
    await collection.addFilter()
    await collection.openFilterNamed("New filter")
    await collection.fillFilterName("Topic")
    await collection.addOption()
    await collection.openOptionInlineEdit(0)

    // Act
    await collection.fillOptionName(0, "")

    // Assert
    await collection.expectOptionNameError("Option name cannot be empty.")
    await collection.expectInlineOptionSaveDisabled()
  })

  test("deleting an unused option can be cancelled", async ({ page }) => {
    const unused = option("Unused option")
    const kept = option("Kept option")
    const seeded = await createCollectionWithTagCategories(
      [
        {
          id: crypto.randomUUID(),
          label: "Topic",
          isRequired: false,
          options: [unused, kept],
        },
      ],
      siteId,
    )
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      seeded.indexPageId,
    )

    // Arrange
    await collection.openFilters()
    await collection.openFilterNamed("Topic")

    // Act
    await collection.openOptionActions(1)
    await collection.clickDeleteOptionMenuItem()
    await collection.cancelDeleteOption()

    // Assert
    await collection.expectOptionNamedVisible("Unused option")
  })

  test("deleting an unused option can be confirmed", async ({ page }) => {
    const unused = option("Unused option")
    const kept = option("Kept option")
    const seeded = await createCollectionWithTagCategories(
      [
        {
          id: crypto.randomUUID(),
          label: "Topic",
          isRequired: false,
          options: [unused, kept],
        },
      ],
      siteId,
    )
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      seeded.indexPageId,
    )

    // Arrange
    await collection.openFilters()
    await collection.openFilterNamed("Topic")

    // Act
    await collection.openOptionActions(1)
    await collection.clickDeleteOptionMenuItem()
    await collection.confirmDeleteOption()

    // Assert
    await collection.expectOptionNamedHidden("Unused option")
    await collection.expectOptionNamedVisible("Kept option")
  })

  test("deleting a used option shows its usage count and removes it from items", async ({
    page,
  }) => {
    const used = option("Used option")
    const kept = option("Other option")
    const categoryId = crypto.randomUUID()
    const seeded = await createCollectionWithTagCategories(
      [
        {
          id: categoryId,
          label: "Topic",
          isRequired: false,
          options: [used, kept],
        },
      ],
      siteId,
    )
    await createCollectionPage({
      collectionId: seeded.collectionId,
      siteId,
      tagged: [used.id],
    })
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      seeded.indexPageId,
    )
    const editor = new PageEditorPO(page)

    // Arrange
    await collection.openFilters()
    await collection.openFilterNamed("Topic")

    // Act
    await collection.openOptionActions(1)
    await collection.clickDeleteOptionMenuItem()
    await collection.expectUsedOptionWarning(1)
    await collection.confirmDeleteOption()
    await collection.saveFilters()
    await editor.clickPublish()
    await editor.expectPublishedToast()

    const collectionPage = await createCollectionPage({
      collectionId: seeded.collectionId,
      siteId,
    })
    await editor.gotoPage(siteId, collectionPage.id)
    await collection.openArticleHeader()
    await collection.openTagCategory("Topic")

    // Assert
    await collection.expectTagOptionHidden("Used option")
    await collection.expectTagOptionVisible("Other option")
  })

  test("deleting a used filter requires confirmation and shows a usage warning", async ({
    page,
  }) => {
    const used = option("Used option")
    const seeded = await createCollectionWithTagCategories(
      [
        {
          id: crypto.randomUUID(),
          label: "Topic",
          isRequired: false,
          options: [used],
        },
      ],
      siteId,
    )
    await createCollectionPage({
      collectionId: seeded.collectionId,
      siteId,
      tagged: [used.id],
    })
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      seeded.indexPageId,
    )

    // Arrange
    await collection.openFilters()

    // Act
    await collection.openFilterActions(1)
    await collection.clickDeleteFilterMenuItem()
    await collection.expectUsedFilterWarning(1)
    await collection.confirmDeleteFilter()
    await collection.saveFilters()

    // Assert
    const saved = await getDraftIndexPage(seeded.indexPageId)
    expect(saved?.tagCategories ?? []).toHaveLength(0)
  })

  test("deleting a filter with many options shows the large-usage warning", async ({
    page,
  }) => {
    const options = Array.from(
      { length: MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT + 1 },
      (_, i) => option(`Option ${i + 1}`),
    )
    const seeded = await createCollectionWithTagCategories(
      [
        {
          id: crypto.randomUUID(),
          label: "Huge filter",
          isRequired: false,
          options,
        },
      ],
      siteId,
    )
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      seeded.indexPageId,
    )

    // Arrange / Act
    await collection.openFilters()
    await collection.openFilterActions(1)
    await collection.clickDeleteFilterMenuItem()

    // Assert
    await collection.expectLargeUsageWarning()
  })

  test("failed usage-count lookups fall back to the undo warning", async ({
    page,
  }) => {
    const seeded = await createCollectionWithTagCategories(
      [
        {
          id: crypto.randomUUID(),
          label: "Topic",
          isRequired: false,
          options: [option("Any option")],
        },
      ],
      siteId,
    )
    await failTagOptionsUsageCount(page)
    const collection = await openCollectionIndexEditor(
      page,
      siteId,
      seeded.indexPageId,
    )

    // Arrange / Act
    await collection.openFilters()
    await collection.openFilterNamed("Topic")
    await collection.openOptionActions(1)
    await collection.clickDeleteOptionMenuItem()

    // Assert
    await collection.expectUsageCountFallback()
  })
})
