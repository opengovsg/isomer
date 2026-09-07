import type { Meta, StoryObj } from "@storybook/nextjs"

import { DefaultNotFound } from "./DefaultNotFound"

const meta: Meta<typeof DefaultNotFound> = {
  title: "Components/DefaultNotFound",
  component: DefaultNotFound,
}

type Story = StoryObj<typeof DefaultNotFound>

// A NOT_FOUND thrown from a site-scoped route. The site itself is known to
// exist and be readable, so the CTA offers its dashboard.
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

// No siteId in the route, so Home is the only destination we can offer.
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

// The dashboard throws NOT_FOUND itself when a site has no RootPage row, so
// the CTA must fall back to Home rather than link to the failing screen.
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
