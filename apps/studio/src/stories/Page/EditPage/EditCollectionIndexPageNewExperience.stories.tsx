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

/**
 * Opens the first option row so the hidden UUID control runs, sets a label, then
 * returns to the options list. Required before "Delete option" (usage modal needs `tagOptionId`).
 */
async function playOpenFirstOptionFillNameAndReturnToOptionsList(
  canvasElement: HTMLElement,
) {
  const canvas = within(canvasElement)
  await userEvent.click(await canvas.findByRole("button", { name: /Item 1/i }))
  await canvas.findByText(/Edit Options/i)
  const optionNameInput = await canvas.findByPlaceholderText(/Option name/i)
  await userEvent.clear(optionNameInput)
  await userEvent.type(optionNameInput, "Option A")
  await userEvent.click(
    await canvas.findByRole("button", { name: /Return to Options/i }),
  )
  await canvas.findByText(/Edit Filters/i)
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
    await playOpenFirstOptionFillNameAndReturnToOptionsList(canvasElement)
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
    await playOpenFirstOptionFillNameAndReturnToOptionsList(canvasElement)
    await clickOptionActionsMenu(canvasElement, 1)
    const portals = withinPortals(canvasElement)
    await userEvent.click(await portals.findByText(/^Delete option$/i), {
      pointerEventsCheck: 0,
    })
    await portals.findByText(/Delete option "Option A"\?/i)
    await portals.findByText(/being used in 3 item\(s\)/i)
    await expect(
      await portals.findByRole("button", { name: /^Delete option$/i }),
    ).toBeDisabled()
  },
}

export const FiltersDeleteOptionModalEnabledCta: Story = {
  parameters: FiltersDeleteOptionModalDisabledCta.parameters,
  play: async (context) => {
    await FiltersDeleteOptionModalDisabledCta.play?.(context)
    const portals = withinPortals(context.canvasElement)
    await userEvent.click(
      portals.getByRole("checkbox", {
        name: /Yes, delete this option permanently/i,
      }),
    )
    const optionDialog = portals.getByRole("dialog")
    await expect(
      within(optionDialog).getByRole("button", { name: /^Delete option$/i }),
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
    await portals.findByText(/being used on 3 item\(s\)/i)
    await expect(
      await portals.findByRole("button", { name: /^Delete filter$/i }),
    ).toBeDisabled()
  },
}

export const FiltersDeleteFilterModalEnabledCta: Story = {
  parameters: FiltersDeleteFilterModalDisabledCta.parameters,
  play: async (context) => {
    await FiltersDeleteFilterModalDisabledCta.play?.(context)
    const portals = withinPortals(context.canvasElement)
    await userEvent.click(
      portals.getByRole("checkbox", {
        name: /Yes, delete this filter permanently/i,
      }),
    )
    const filterDialog = portals.getByRole("dialog")
    await expect(
      within(filterDialog).getByRole("button", { name: /^Delete filter$/i }),
    ).not.toBeDisabled()
  },
}
