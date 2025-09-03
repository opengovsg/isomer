import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, waitFor, within } from "@storybook/test"
import { ResourceState } from "~prisma/generated/generatedEnums"
import { collectionHandlers } from "tests/msw/handlers/collection"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import CollectionLinkPage from "~/pages/sites/[siteId]/links/[linkId]"
import {
  createBannerGbParameters,
  createDropdownGbParameters,
} from "~/stories/utils/growthbook"

const COMMON_HANDLERS = [
  meHandlers.me(),
  pageHandlers.listWithoutRoot.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.getCategories.default(),
  pageHandlers.countWithoutRoot.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getTheme.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  resourceHandlers.getRolesFor.admin(),
  resourceHandlers.getWithFullPermalink.default(),
  resourceHandlers.getAncestryStack.default(),
  resourceHandlers.getBatchAncestryWithSelf.default(),
  resourceHandlers.getChildrenOf.default(),
  resourceHandlers.getMetadataById.article(),
  resourceHandlers.getParentOf.collection(),
  collectionHandlers.getMetadata.default(),
  collectionHandlers.readCollectionLink.default(),
  pageHandlers.readPageAndBlob.article(),
  pageHandlers.readPage.article(),
  pageHandlers.getFullPermalink.article(),
  pageHandlers.getCollectionTags.default(),
]

const meta: Meta<typeof CollectionLinkPage> = {
  title: "Pages/Edit Page/Collection Link Page",
  component: CollectionLinkPage,
  parameters: {
    getLayout: CollectionLinkPage.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
          linkId: "1",
        },
        pathname: "/sites/[siteId]/links/[linkId]",
      },
    },
  },
}

export default meta

export const Default: Story = {}

type Story = StoryObj<typeof CollectionLinkPage>
export const Dropdown: Story = {
  parameters: {
    growthbook: [createDropdownGbParameters("1")],
    msw: {
      handlers: [pageHandlers.getCollectionTags.empty(), ...COMMON_HANDLERS],
    },
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    // waitFor used as we can override the default timeout of findByRole (1000ms)
    // this is needed as growthbook might take more than 1000ms to initialise
    const button = await waitFor(() => screen.findByRole("combobox"), {
      timeout: 5000,
    })
    await userEvent.click(button)
  },
}

export const WithThumbnail: Story = {
  parameters: {
    msw: {
      handlers: [
        collectionHandlers.readCollectionLink.thumbnail(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const PublishedState: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPage.article({
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

export const WithModal: Story = {
  play: async (context) => {
    const { canvasElement } = context
    const screen = within(canvasElement)
    const button = await screen.findByRole("button", {
      name: /Link something.../i,
    })
    await userEvent.click(button)
  },
}
