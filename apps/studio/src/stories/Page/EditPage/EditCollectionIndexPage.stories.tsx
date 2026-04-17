import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, userEvent, within } from "storybook/test"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"
import { userHandlers } from "tests/msw/handlers/user"
import { IS_NEW_COLLECTION_EDITING_EXPERIENCE_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import EditPage from "~/pages/sites/[siteId]/pages/[pageId]"
import { createBannerGbParameters } from "~/stories/utils/growthbook"
import { ResourceState } from "~prisma/generated/generatedEnums"

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
]

const meta: Meta<typeof EditPage> = {
  title: "Pages/Edit Page/Collection Index Page",
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

export const Default: Story = {}

export const EditFixedBlockState: Story = {
  parameters: { disableMockDate: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole("button", {
      name: /Page description and summary/i,
    })
    await userEvent.click(button)
  },
}

export const SaveToast: Story = {
  parameters: { disableMockDate: true },
  play: async ({ canvasElement, ...rest }) => {
    await EditFixedBlockState.play?.({ canvasElement, ...rest })
    const canvas = within(canvasElement)

    const textbox = await canvas.findByPlaceholderText("Summary")
    await userEvent.type(textbox, "very cool summary")

    const saveButton = await canvas.findByRole("button", {
      name: /Save changes/i,
    })
    await userEvent.click(saveButton)
  },
}

export const PublishedState: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPage.content({
          state: ResourceState.Published,
          draftBlobId: null,
        }),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const WithBanner: Story = {
  parameters: {
    growthbook: [
      createBannerGbParameters({
        variant: "info",
        message: "This is a test banner",
      }),
    ],
  },
}

export const NewCollectionIndexEditingExperienceNonIsomerAdmin: Story = {
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
export const NewCollectionIndexEditingExperienceIsomerAdmin: Story = {
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

export const NewCollectionIndexEditingExperienceForDisplay: Story = {
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
export const NewCollectionIndexEditingExperienceForFilters: Story = {
  parameters: newCollectionFiltersIsomerAdminParameters,
  play: async ({ canvasElement }) => {
    await playOpenManageFilters(canvasElement)
  },
}

export const NewCollectionIndexEditingExperienceFiltersAddThreeOptions: Story =
  {
    parameters: newCollectionFiltersIsomerAdminParameters,
    play: async ({ canvasElement }) => {
      await playOpenManageFilters(canvasElement)
      await playOpenFirstFilterEditor(canvasElement)
      await playFillFilterNameAndAddThreeOptions(canvasElement)
    },
  }

export const NewCollectionIndexEditingExperienceFiltersOptionNameCharacterCount: Story =
  {
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

export const NewCollectionIndexEditingExperienceFiltersOpenOptionRowMenu: Story =
  {
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

export const NewCollectionIndexEditingExperienceFiltersDeleteOptionModalDisabledCta: Story =
  {
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
      await portals.findByText(/Delete option\?/i)
      await expect(
        await portals.findByRole("button", { name: /^Delete option$/i }),
      ).toBeDisabled()
    },
  }

export const NewCollectionIndexEditingExperienceFiltersDeleteOptionModalEnabledCta: Story =
  {
    parameters: newCollectionFiltersIsomerAdminParameters,
    play: async (context) => {
      await NewCollectionIndexEditingExperienceFiltersDeleteOptionModalDisabledCta.play?.(
        context,
      )
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

export const NewCollectionIndexEditingExperienceFiltersBackShowsOptionCount: Story =
  {
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

export const NewCollectionIndexEditingExperienceFiltersOpenFilterRowMenu: Story =
  {
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

export const NewCollectionIndexEditingExperienceFiltersDeleteFilterModalDisabledCta: Story =
  {
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

export const NewCollectionIndexEditingExperienceFiltersDeleteFilterModalEnabledCta: Story =
  {
    parameters: newCollectionFiltersIsomerAdminParameters,
    play: async (context) => {
      await NewCollectionIndexEditingExperienceFiltersDeleteFilterModalDisabledCta.play?.(
        context,
      )
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
