import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, within } from "storybook/test"
import { collectionHandlers } from "tests/msw/handlers/collection"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"
import { IS_NEW_COLLECTION_EDITING_EXPERIENCE_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
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
  collectionHandlers.getCategoryOptionUsageCount.default(),
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

const newCollectionFiltersIsomerAdminParameters = {
  growthbook: [
    [IS_NEW_COLLECTION_EDITING_EXPERIENCE_ENABLED_FEATURE_KEY, true],
  ],
  msw: {
    handlers: [userHandlers.isIsomerAdmin.admin(), ...COMMON_HANDLERS],
  },
} satisfies Story["parameters"]

async function playOpenManageFilters(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  const filtersEntry = await canvas.findByRole("button", { name: /Filters/i })
  await userEvent.click(filtersEntry)
  await canvas.findByText(/Manage filters/i)
}

/** Ensures at least one filter row exists, opens nested "Edit Filters" editor. */
async function playOpenFirstFilterEditor(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  if (!canvas.queryByRole("button", { name: /Item 1/i })) {
    await userEvent.click(
      await canvas.findByRole("button", { name: /Add a filter/i }),
    )
  }
  await userEvent.click(await canvas.findByRole("button", { name: /Item 1/i }))
  await canvas.findByText(/Edit Filters/i)
}

/** From "Edit Filters": add three options and assert default row labels. */
async function playFillFilterNameAndAddThreeOptions(
  canvasElement: HTMLElement,
) {
  const canvas = within(canvasElement)
  const filterNameInput = await canvas.findByPlaceholderText(/Filter name/i)
  await userEvent.clear(filterNameInput)
  await userEvent.type(filterNameInput, "Test filter")
  const addOption = await canvas.findByRole("button", { name: /^Add option$/i })
  await userEvent.click(addOption)
  await userEvent.click(addOption)
  await userEvent.click(addOption)
  await canvas.findByRole("button", { name: /Item 1/i })
  await canvas.findByRole("button", { name: /Item 2/i })
  await canvas.findByRole("button", { name: /Item 3/i })
}

/** From “Manage filters”: open nested “Edit Category” (default category options). */
async function playOpenCategoryOptionsEditor(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  const openBtn = await canvas.findByRole("button", {
    name: /Category \(Default\)/i,
  })
  await userEvent.click(openBtn)
  await canvas.findByText(/Edit Category/i)
}

/** Inside “Edit Category”: add three option rows (labels may be empty). */
async function playAddThreeCategoryOptions(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  const addOption = await canvas.findByRole("button", { name: /^Add option$/i })
  await userEvent.click(addOption)
  await userEvent.click(addOption)
  await userEvent.click(addOption)
  await canvas.findByRole("button", { name: /Item 1/i })
  await canvas.findByRole("button", { name: /Item 2/i })
  await canvas.findByRole("button", { name: /Item 3/i })
}

/** Fill option names so “Save changes” enables (blank labels keep save disabled). */
async function playFillThreeCategoryOptionNames(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  for (let i = 1; i <= 3; i += 1) {
    await userEvent.click(
      await canvas.findByRole("button", { name: new RegExp(`Item ${i}`, "i") }),
    )
    const nameInput = await canvas.findByPlaceholderText(/Option name/i)
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, `Option ${i}`)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Return to Options/i }),
    )
  }
}

/**
 * Each option only receives an `id` after its row is opened (hidden UUID control mounts). Fill
 * names, save to leave “Edit Category”, then open it again so delete can show the usage modal
 * instead of removing the row immediately.
 */
async function playFillNamesSaveCategoryOptionsAndReopenEditCategory(
  canvasElement: HTMLElement,
) {
  await playFillThreeCategoryOptionNames(canvasElement)
  const canvas = within(canvasElement)
  await userEvent.click(
    await canvas.findByRole("button", { name: /Save category options/i }),
  )
  await canvas.findByText(/Manage filters/i)
  await playOpenCategoryOptionsEditor(canvasElement)
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

export const NonIsomerAdmin: Story = {
  parameters: {
    growthbook: [
      [IS_NEW_COLLECTION_EDITING_EXPERIENCE_ENABLED_FEATURE_KEY, true],
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Manage Collection/i)
  },
}

// "Filters" block is currently only accessible by Isomer Admin
export const IsomerAdmin: Story = {
  parameters: {
    growthbook: [
      [IS_NEW_COLLECTION_EDITING_EXPERIENCE_ENABLED_FEATURE_KEY, true],
    ],
    msw: {
      handlers: [userHandlers.isIsomerAdmin.admin(), ...COMMON_HANDLERS],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Manage Collection/i)
  },
}

export const CollectionDisplay: Story = {
  parameters: {
    growthbook: [
      [IS_NEW_COLLECTION_EDITING_EXPERIENCE_ENABLED_FEATURE_KEY, true],
    ],
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

// Currently only accessible by Isomer Admin
export const ManageFilters: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
  },
}

export const FiltersAddThreeOptions: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
  },
}

export const FiltersOptionNameCharacterCount: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Item 1/i }),
    )
    const optionNameInput = await canvas.findByPlaceholderText(/Option name/i)
    await userEvent.clear(optionNameInput)
    await userEvent.type(optionNameInput, "hello")
    await canvas.findByText(/65 characters left/i)
  },
}

export const FiltersOpenOptionRowMenu: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
    await clickOptionActionsMenu(canvasElement, 1)
    const portals = withinPortals(canvasElement)
    await expect(await portals.findByText(/^Delete option$/i)).toBeVisible()
  },
}

export const FiltersDeleteOptionModalDisabledCta: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
    await clickOptionActionsMenu(canvasElement, 1)
    const portals = withinPortals(canvasElement)
    await userEvent.click(await portals.findByText(/^Delete option$/i), {
      pointerEventsCheck: 0,
    })
    await portals.findByRole("dialog", { name: /Delete filter option/i })
    await expect(
      await portals.findByRole("button", { name: /^Delete option$/i }),
    ).toBeDisabled()
  },
}

export const FiltersDeleteOptionModalEnabledCta: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async (context) => {
    await FiltersDeleteOptionModalDisabledCta.play?.(context)
    const portals = withinPortals(context.canvasElement)
    await userEvent.click(
      portals.getByRole("checkbox", {
        name: /Yes, delete this option permanently/i,
      }),
    )
    await expect(
      await portals.findByRole("button", { name: /^Delete option$/i }),
    ).not.toBeDisabled()
  },
}

export const FiltersBackShowsOptionCount: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
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
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Return to Filters/i }),
    )
    await userEvent.click(
      await canvas.findByRole("button", { name: /Filter actions/i }),
    )
    const portals = withinPortals(canvasElement)
    await expect(
      await portals.findByRole("menuitem", { name: /Delete filter/i }),
    ).toBeVisible()
  },
}

export const FiltersDeleteFilterModalDisabledCta: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenFirstFilterEditor(canvasElement)
    await playFillFilterNameAndAddThreeOptions(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Return to Filters/i }),
    )
    await userEvent.click(
      await canvas.findByRole("button", { name: /Filter actions/i }),
    )
    const portals = withinPortals(canvasElement)
    await userEvent.click(
      await portals.findByRole("menuitem", { name: /Delete filter/i }),
    )
    await portals.findByText(/Delete filter "Test filter"\?/i)
    await expect(
      await portals.findByRole("button", { name: /^Delete filter$/i }),
    ).toBeDisabled()
  },
}

export const FiltersDeleteFilterModalEnabledCta: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async (context) => {
    await FiltersDeleteFilterModalDisabledCta.play?.(context)
    const portals = withinPortals(context.canvasElement)
    await userEvent.click(
      portals.getByRole("checkbox", {
        name: /Yes, delete this filter permanently/i,
      }),
    )
    await expect(
      await portals.findByRole("button", { name: /^Delete filter$/i }),
    ).not.toBeDisabled()
  },
}

export const CategoryOptionsOpenEditCategory: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenCategoryOptionsEditor(canvasElement)
  },
}

export const CategoryOptionsAddThreeOptions: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenCategoryOptionsEditor(canvasElement)
    await playAddThreeCategoryOptions(canvasElement)
  },
}

export const CategoryOptionsOpenOptionRowMenu: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenCategoryOptionsEditor(canvasElement)
    await playAddThreeCategoryOptions(canvasElement)
    await clickOptionActionsMenu(canvasElement, 1)
    const portals = withinPortals(canvasElement)
    await expect(await portals.findByText(/^Delete option$/i)).toBeVisible()
  },
}

export const CategoryOptionsDeleteOptionModalDisabledCta: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenCategoryOptionsEditor(canvasElement)
    await playAddThreeCategoryOptions(canvasElement)
    await playFillNamesSaveCategoryOptionsAndReopenEditCategory(canvasElement)
    await clickOptionActionsMenu(canvasElement, 1)
    const portals = withinPortals(canvasElement)
    await userEvent.click(await portals.findByText(/^Delete option$/i), {
      pointerEventsCheck: 0,
    })
    const deleteCategoryOptionDialog = await portals.findByRole("dialog", {
      name: /Delete category option/i,
    })
    await within(deleteCategoryOptionDialog).findByText(
      /This option is being used in 3 items\./i,
    )
    await expect(
      await portals.findByRole("button", { name: /^Delete option$/i }),
    ).toBeDisabled()
  },
}

export const CategoryOptionsDeleteOptionModalEnabledCta: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async (context) => {
    await CategoryOptionsDeleteOptionModalDisabledCta.play?.(context)
    const portals = withinPortals(context.canvasElement)
    await userEvent.click(
      portals.getByRole("checkbox", {
        name: /Yes, delete this option permanently/i,
      }),
    )
    await expect(
      await portals.findByRole("button", { name: /^Delete option$/i }),
    ).not.toBeDisabled()
  },
}

export const CategoryOptionsSaveShowsOptionCount: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
    await playOpenCategoryOptionsEditor(canvasElement)
    await playAddThreeCategoryOptions(canvasElement)
    await playFillThreeCategoryOptionNames(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole("button", { name: /Save category options/i }),
    )
    await canvas.findByText(/Manage filters/i)
    await canvas.findByText(/3 options/i)
  },
}
