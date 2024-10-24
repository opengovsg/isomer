import type { Meta, StoryObj } from "@storybook/react"
import { collectionHandlers } from "tests/msw/handlers/collection"
import { meHandlers } from "tests/msw/handlers/me"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"
import { sitesHandlers } from "tests/msw/handlers/sites"

import CollectionLinkPage from "~/pages/sites/[siteId]/links/[linkId]"
import { createBannerGbParameters } from "~/stories/utils/growthbook"

const COMMON_HANDLERS = [
  meHandlers.me(),
  pageHandlers.listWithoutRoot.default(),
  pageHandlers.getRootPage.default(),
  pageHandlers.countWithoutRoot.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  sitesHandlers.getTheme.default(),
  sitesHandlers.getConfig.default(),
  sitesHandlers.getFooter.default(),
  sitesHandlers.getNavbar.default(),
  sitesHandlers.getLocalisedSitemap.default(),
  resourceHandlers.getRolesFor.default(),
  resourceHandlers.getChildrenOf.default(),
  resourceHandlers.getMetadataById.article(),
  resourceHandlers.getParentOf.collection(),
  collectionHandlers.getMetadata.default(),
  collectionHandlers.readCollectionLink.default(),
  pageHandlers.readPageAndBlob.article(),
  pageHandlers.readPage.article(),
  pageHandlers.getFullPermalink.article(),
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
type Story = StoryObj<typeof CollectionLinkPage>

export const Default: Story = {}

export const PublishedState: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.readPage.article({
          state: "Published",
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
