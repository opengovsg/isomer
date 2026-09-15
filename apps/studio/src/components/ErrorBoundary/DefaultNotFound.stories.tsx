import type { Meta, StoryObj } from "@storybook/nextjs"
import { expect, within } from "storybook/test"

import { DefaultNotFound } from "./DefaultNotFound"
import { ALL_SITES_CTA, type NotFoundCta } from "./getNotFoundCta"

const meta: Meta<typeof DefaultNotFound> = {
  title: "Components/DefaultNotFound",
  component: DefaultNotFound,
}

type Story = StoryObj<typeof DefaultNotFound>

const assertCta = async (canvasElement: HTMLElement, cta: NotFoundCta) => {
  const canvas = within(canvasElement)
  const link = await canvas.findByRole("link", { name: cta.label })
  await expect(link).toHaveAttribute("href", cta.href)
}

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
  play: async ({ canvasElement }) => {
    await assertCta(canvasElement, {
      href: "/sites/1",
      label: "Back to your site",
    })
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
  play: async ({ canvasElement }) => {
    await assertCta(canvasElement, ALL_SITES_CTA)
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
  play: async ({ canvasElement }) => {
    await assertCta(canvasElement, ALL_SITES_CTA)
  },
}

export default meta
