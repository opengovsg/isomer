import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { collectionHandlers } from "tests/msw/handlers/collection"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import EditPage from "~/pages/sites/[siteId]/pages/[pageId]"

const COMMON_HANDLERS = [
  meHandlers.me(),
  pageHandlers.listWithoutRoot.default(),
  pageHandlers.updatePageBlob.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.countWithoutRoot.default(),
  sitesHandlers.getTheme.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
  resourceHandlers.getChildrenOf.default(),
  resourceHandlers.getAncestryStack.default(),
  resourceHandlers.getBatchAncestryWithSelf.default(),
  resourceHandlers.getRolesFor.admin(),
  // NOTE: Handlers that return custom data for this story
  sitesHandlers.getLocalisedSitemap.collection(),
  resourceHandlers.getWithFullPermalink.index(),
  resourceHandlers.getMetadataById.index(),
  pageHandlers.readPageAndBlob.collection(),
  pageHandlers.readPage.index(),
  pageHandlers.getFullPermalink.collection(),
  collectionHandlers.countTagOptionsUsage.default(),
]

const meta: Meta<typeof EditPage> = {
  title: "Pages/Edit Page/Collection Index Page/New Experience",
  component: EditPage,
  parameters: {
    getLayout: EditPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
          pageId: "1",
        },
        pathname: "/sites/[siteId]/pages/[pageId]",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof EditPage>

const newCollectionFiltersParameters = {
  growthbook: [[IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY, true]],
} satisfies Story["parameters"]

const zeroTagOptionsUsageParameters = {
  growthbook: [[IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY, true]],
  msw: {
    handlers: [
      ...COMMON_HANDLERS.slice(0, -1),
      collectionHandlers.countTagOptionsUsage.zero(),
    ],
  },
} satisfies Story["parameters"]

/** Chromatic delay for play-driven inline edit snapshots. */
const inlineEditSnapshotParameters = {
  ...newCollectionFiltersParameters,
  chromatic: { delay: 300 },
} satisfies Story["parameters"]

async function playOpenManageFilters(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  const filtersEntry = await canvas.findByRole("button", { name: /Filters/i })
  await userEvent.click(filtersEntry)
  await canvas.findByText(/Manage filters/i)
}

/** Click an option row's label to enter inline edit mode (index is 0-based). */
async function clickOptionRowToEdit(
  canvasElement: HTMLElement,
  index0Based: number,
) {
  const canvas = within(canvasElement)
  const namedRow = canvas.queryByText(new RegExp(`^Option ${index0Based + 1}$`))
  if (namedRow) {
    await userEvent.click(namedRow)
    return
  }

  // When filling rows in order, the next unnamed row is always the first
  // remaining "New option" label (not the nth match).
  const [nextUnrenamedRow] = canvas.getAllByText(/^New option$/)
  if (!nextUnrenamedRow) {
    throw new Error(`No editable option row found for index ${index0Based}`)
  }
  await userEvent.click(nextUnrenamedRow)
}

/** Open inline edit for an option row and wait for the name textbox (index is 0-based). */
async function playOpenInlineOptionEdit(
  canvasElement: HTMLElement,
  index0Based = 0,
) {
  const canvas = within(canvasElement)
  await clickOptionRowToEdit(canvasElement, index0Based)
  await canvas.findByRole("textbox", {
    name: `Option ${index0Based + 1} name`,
  })
}

/** Manage filters → first filter editor with a single default option row. */
async function playOpenFilterEditorWithOneOption(canvasElement: HTMLElement) {
  await playOpenManageFilters(canvasElement)
  await playOpenFirstFilterEditor(canvasElement)
  const canvas = within(canvasElement)
  await userEvent.click(
    await canvas.findByRole("button", { name: /^Add option$/i }),
  )
}

/** Confirm inline option rename via the row's tick button (not the drawer save). */
async function confirmInlineOptionRename(nameInput: HTMLElement) {
  const row = nameInput.parentElement
  if (!row) {
    throw new Error("Expected inline edit row container")
  }
  await userEvent.click(
    within(row).getByRole("button", { name: /^Save changes$/i }),
  )
}

/** Rename an option row via inline EditableLabel (index is 0-based). */
async function renameOptionAtIndex(
  canvasElement: HTMLElement,
  index0Based: number,
  name: string,
) {
  const canvas = within(canvasElement)
  await clickOptionRowToEdit(canvasElement, index0Based)
  const nameInput = await canvas.findByRole("textbox", {
    name: `Option ${index0Based + 1} name`,
  })
  await userEvent.clear(nameInput)
  await userEvent.type(nameInput, name)
  await confirmInlineOptionRename(nameInput)
}

/** Assert three default option rows show clickable "New option" labels. */
async function assertThreeDefaultOptionRows(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  const newOptionLabels = await canvas.findAllByText(/^New option$/)
  await expect(newOptionLabels).toHaveLength(3)
}

/** Ensures at least one filter row exists, opens nested "Edit Filters" editor. */
async function playOpenFirstFilterEditor(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  if (!canvas.queryByText("New filter")) {
    await userEvent.click(
      await canvas.findByRole("button", { name: /Add a filter/i }),
    )
  }
  await userEvent.click(await canvas.findByText("New filter"))
  await canvas.findByText(/Edit Filters/i)
}

/** From "Edit Filters": rename filter, add three options, assert default row labels. */
async function playFillFilterNameAndAddThreeOptions(
  canvasElement: HTMLElement,
) {
  const canvas = within(canvasElement)
  const filterNameInput = await canvas.findByPlaceholderText(/Filter name/i)
  await userEvent.clear(filterNameInput)
  await userEvent.type(filterNameInput, "Test filter")

  const addOption = await canvas.findByRole("button", { name: /^Add option$/i })
  for (let i = 0; i < 3; i += 1) {
    await userEvent.click(addOption)
  }

  await assertThreeDefaultOptionRows(canvasElement)
}

async function clickOptionActionsMenu(
  canvasElement: HTMLElement,
  optionIndex1Based: number,
) {
  const canvas = within(canvasElement)
  const trigger = await canvas.findByRole("button", {
    name: `Option ${optionIndex1Based} actions`,
  })
  await userEvent.click(trigger)
}

/** Chakra portals render into the story iframe body, not the parent `document.body`. */
function withinPortals(canvasElement: HTMLElement) {
  return within(canvasElement.ownerDocument.body)
}

async function playOpenDeleteOptionModal(canvasElement: HTMLElement) {
  await playOpenManageFilters(canvasElement)
  await playOpenFirstFilterEditor(canvasElement)
  await playFillFilterNameAndAddThreeOptions(canvasElement)
  await renameOptionAtIndex(canvasElement, 0, "Option 1")
  await clickOptionActionsMenu(canvasElement, 1)
  const portals = withinPortals(canvasElement)
  await userEvent.click(await portals.findByText(/^Delete option$/i), {
    pointerEventsCheck: 0,
  })
  await portals.findByRole("dialog", { name: /Delete filter option/i })
  return portals
}

async function playOpenDeleteFilterModal(canvasElement: HTMLElement) {
  await playOpenManageFilters(canvasElement)
  await playOpenFirstFilterEditor(canvasElement)
  await playFillFilterNameAndAddThreeOptions(canvasElement)
  const canvas = within(canvasElement)
  await userEvent.click(
    await canvas.findByRole("button", { name: /Return to Filters/i }),
  )
  await userEvent.click(
    await canvas.findByRole("button", { name: /Filter 1 actions/i }),
  )
  const portals = withinPortals(canvasElement)
  await userEvent.click(
    await portals.findByRole("menuitem", { name: /Delete filter/i }),
  )
  await portals.findByText(/You are deleting an entire filter\./i)
  return portals
}

export const ManageCollection: Story = {
  parameters: {
    growthbook: [[IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY, true]],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Manage Collection/i)
    await expect(
      canvas.getByRole("button", { name: /Collection display/i }),
    ).toBeVisible()
    await expect(canvas.getByRole("button", { name: /Filters/i })).toBeVisible()
  },
}

/** Editors can open Collection display but cannot manage Filters. */
export const ManageCollectionAsEditor: Story = {
  parameters: {
    growthbook: [[IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY, true]],
    msw: {
      handlers: [resourceHandlers.getRolesFor.editor(), ...COMMON_HANDLERS],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Manage Collection/i)
    await expect(
      canvas.getByRole("button", { name: /Collection display/i }),
    ).toBeVisible()
    await expect(
      canvas.queryByRole("button", { name: /Filters/i }),
    ).not.toBeInTheDocument()
  },
}

export const CollectionDisplay: Story = {
  parameters: {
    growthbook: [[IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY, true]],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /Collection display/i,
    })
    await userEvent.click(button)
    await canvas.findByText(/Collection display/i)
  },
}

export const ManageFilters: Story = {
  parameters: newCollectionFiltersParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
  },
}

export const FiltersAddThreeOptions: Story = {
  parameters: newCollectionFiltersParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
  },
}

export const FiltersOpenOptionRowMenu: Story = {
  parameters: newCollectionFiltersParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
    await renameOptionAtIndex(canvasElement, 0, "Option 1")
    await clickOptionActionsMenu(canvasElement, 1)
    const portals = withinPortals(canvasElement)
    await expect(await portals.findByText(/^Delete option$/i)).toBeVisible()
  },
}

export const FiltersDeleteOptionModalDisabledCta: Story = {
  parameters: newCollectionFiltersParameters,
  play: async ({ canvasElement }) => {
    const portals = await playOpenDeleteOptionModal(canvasElement)
    await expect(
      await portals.findByRole("button", { name: /^Delete filter option$/i }),
    ).toBeDisabled()
  },
}

export const FiltersDeleteOptionModalEnabledCta: Story = {
  parameters: newCollectionFiltersParameters,
  play: async (context) => {
    await FiltersDeleteOptionModalDisabledCta.play?.(context)
    const portals = withinPortals(context.canvasElement)
    await userEvent.click(
      portals.getByRole("checkbox", {
        name: /Yes, delete this filter option permanently/i,
      }),
    )
    await expect(
      await portals.findByRole("button", { name: /^Delete filter option$/i }),
    ).not.toBeDisabled()
  },
}

export const FiltersDeleteOptionModalZeroUsage: Story = {
  parameters: zeroTagOptionsUsageParameters,
  play: async ({ canvasElement }) => {
    const portals = await playOpenDeleteOptionModal(canvasElement)
    await expect(
      portals.queryByText(/This option is being used in/i),
    ).not.toBeInTheDocument()
    await portals.findByText(
      /To undo this change, you will need to create and re-assign this option to all items\./i,
    )
  },
}

export const FiltersBackShowsOptionCount: Story = {
  parameters: newCollectionFiltersParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Return to Filters/i }),
    )
    await canvas.findByText(/Manage filters/i)
    await canvas.findByText(/3 options/i)
  },
}

export const FiltersOpenFilterRowMenu: Story = {
  parameters: newCollectionFiltersParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Return to Filters/i }),
    )
    await userEvent.click(
      await canvas.findByRole("button", { name: /Filter 1 actions/i }),
    )
    const portals = withinPortals(canvasElement)
    await expect(
      await portals.findByRole("menuitem", { name: /Delete filter/i }),
    ).toBeVisible()
  },
}

export const FiltersDeleteFilterModalDisabledCta: Story = {
  parameters: newCollectionFiltersParameters,
  play: async ({ canvasElement }) => {
    const portals = await playOpenDeleteFilterModal(canvasElement)
    await portals.findByText(/It’s being used on/i)
    await expect(
      await portals.findByRole("button", { name: /^Delete filter$/i }),
    ).toBeDisabled()
  },
}

export const FiltersDeleteFilterModalEnabledCta: Story = {
  parameters: newCollectionFiltersParameters,
  play: async (context) => {
    await FiltersDeleteFilterModalDisabledCta.play?.(context)
    const portals = withinPortals(context.canvasElement)
    await userEvent.click(
      portals.getByRole("checkbox", {
        name: /Yes, delete the entire filter permanently/i,
      }),
    )
    await expect(
      await portals.findByRole("button", { name: /^Delete filter$/i }),
    ).not.toBeDisabled()
  },
}

export const FiltersDeleteFilterModalZeroUsage: Story = {
  parameters: zeroTagOptionsUsageParameters,
  play: async ({ canvasElement }) => {
    const portals = await playOpenDeleteFilterModal(canvasElement)
    await expect(
      portals.queryByText(/It’s being used on/i),
    ).not.toBeInTheDocument()
    await portals.findByText(
      /To undo this change, you will need to recreate this filter and assign options to each item individually\./i,
    )
  },
}

export const FiltersDeleteFilterModalManyOptions: Story = {
  parameters: {
    growthbook: [[IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY, true]],
    msw: {
      handlers: [
        pageHandlers.readPageAndBlob.collectionWithManyFilterOptions(),
        ...COMMON_HANDLERS,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Filter 1 actions/i }),
    )
    const portals = withinPortals(canvasElement)
    await userEvent.click(
      await portals.findByRole("menuitem", { name: /Delete filter/i }),
    )
    await portals.findByText(/You are deleting an entire filter\./i)
    // A filter with 100+ options skips the usage-count query entirely (see
    // MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT) rather than showing a misleading
    // capped number.
    await portals.findByText(/a large number of results/i)
  },
}

export const CollectionDisplaySaveToast: Story = {
  parameters: {
    growthbook: [[IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY, true]],
    msw: {
      handlers: COMMON_HANDLERS,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Collection display/i }),
    )
    await userEvent.click(
      await canvas.findByRole("button", { name: /Save changes/i }),
    )
    await waitFor(
      () => {
        void expect(
          withinPortals(canvasElement).getByText(
            /Collection display saved\. Remember to publish the changes so that other users can see your updates\./,
          ),
        ).toBeVisible()
      },
      { timeout: 5000 },
    )
  },
}

export const ManageFiltersSaveToast: Story = {
  parameters: {
    growthbook: [[IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY, true]],
  },
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Save changes/i }),
    )
    await waitFor(
      () => {
        void expect(
          withinPortals(canvasElement).getByText(
            /Filter saved\. Remember to publish the changes so that other users can use the new filter options\./,
          ),
        ).toBeVisible()
      },
      { timeout: 5000 },
    )
  },
}

export const FiltersInlineEditTyping: Story = {
  parameters: inlineEditSnapshotParameters,
  play: async ({ canvasElement }) => {
    await playOpenFilterEditorWithOneOption(canvasElement)
    await playOpenInlineOptionEdit(canvasElement, 0)
    const canvas = within(canvasElement)
    const nameInput = canvas.getByRole("textbox", { name: "Option 1 name" })
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, "Announcements")
  },
}

export const FiltersInlineEditBlankError: Story = {
  parameters: inlineEditSnapshotParameters,
  play: async ({ canvasElement }) => {
    await playOpenFilterEditorWithOneOption(canvasElement)
    await playOpenInlineOptionEdit(canvasElement, 0)
    const canvas = within(canvasElement)
    const nameInput = canvas.getByRole("textbox", { name: "Option 1 name" })
    await userEvent.clear(nameInput)
    await expect(
      canvas.getByText(/Option name cannot be empty\./i),
    ).toBeVisible()
    const row = nameInput.parentElement
    if (!row) throw new Error("Expected inline edit row container")
    await expect(
      within(row).getByRole("button", { name: /^Save changes$/i }),
    ).toBeDisabled()
  },
}

export const FiltersInlineEditDuplicateError: Story = {
  parameters: inlineEditSnapshotParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    const canvas = within(canvasElement)
    const addOption = await canvas.findByRole("button", {
      name: /^Add option$/i,
    })
    await userEvent.click(addOption)
    await userEvent.click(addOption)
    await renameOptionAtIndex(canvasElement, 0, "Same name")
    await playOpenInlineOptionEdit(canvasElement, 1)
    const nameInput = canvas.getByRole("textbox", { name: "Option 2 name" })
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, "Same name")
    const duplicateErrors = await canvas.findAllByText(
      /An option with this name already exists\./i,
    )
    await expect(duplicateErrors.length).toBeGreaterThanOrEqual(2)
  },
}
