import type { Meta, StoryObj } from "@storybook/react"
import { pageHandlers } from "tests/msw/handlers/page"
import { resourceHandlers } from "tests/msw/handlers/resource"

import PageSettings from "~/pages/sites/[siteId]/pages/[pageId]/settings"
import { createBannerGbParameters } from "~/stories/utils/growthbook"

const COMMON_HANDLERS = [
  resourceHandlers.getMetadataById.content(),
  pageHandlers.readPageAndBlob.content(),
  pageHandlers.readPage.content(),
]

const meta: Meta<typeof PageSettings> = {
  title: "Pages/Edit Page/Settings",
  component: PageSettings,
  parameters: {
    getLayout: PageSettings.getLayout,
    msw: {
      handlers: COMMON_HANDLERS,
    },
    nextjs: {
      router: {
        query: {
          siteId: "1",
          pageId: "1",
        },
        pathname: "/sites/[siteId]/pages/[pageId]/settings",
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof PageSettings>

export const Root: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.getPermalinkTree.root(),
        pageHandlers.readPageAndBlob.homepage(),
        pageHandlers.readPage.homepage(),
        resourceHandlers.getMetadataById.homepage(),
      ],
    },
  },
}

export const WithParent: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.getPermalinkTree.withParent(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const WithGrandparent: Story = {
  parameters: {
    msw: {
      handlers: [
        pageHandlers.getPermalinkTree.withGrandParent(),
        ...COMMON_HANDLERS,
      ],
    },
  },
}

export const WithBanner: Story = {
  parameters: {
    ...Root.parameters,
    growthbook: [
      createBannerGbParameters({
        variant: "warn",
        message: "This is a warning test banner",
      }),
    ],
  },
}
