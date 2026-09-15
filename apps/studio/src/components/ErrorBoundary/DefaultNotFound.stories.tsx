import type { Meta, StoryObj } from "@storybook/nextjs"

import { DefaultNotFound } from "./DefaultNotFound"

const meta: Meta<typeof DefaultNotFound> = {
  title: "Components/DefaultNotFound",
  component: DefaultNotFound,
}

type Story = StoryObj<typeof DefaultNotFound>

// NOT_FOUND on a nested site route. CTA links to the site dashboard.
export const InsideSite: Story = {
  parameters: {
    nextjs: {
      router: {
        pathname: "/sites/[siteId]/pages/[pageId]",
        query: { siteId: "1", pageId: "2" },
      },
    },
  },
}

// No siteId in the route. CTA links to /.
export const OutsideSite: Story = {
  parameters: {
    nextjs: {
      router: {
        pathname: "/",
        query: {},
      },
    },
  },
}

// /sites/[siteId] with no RootPage. CTA links to /, not the dashboard.
export const OnSiteDashboard: Story = {
  parameters: {
    nextjs: {
      router: {
        pathname: "/sites/[siteId]",
        query: { siteId: "1" },
      },
    },
  },
}

export default meta
