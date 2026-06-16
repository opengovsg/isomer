import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"

import { PreviewChrome } from "./PreviewChrome"

const meta: Meta<typeof PreviewChrome> = {
  title: "Features/PreviewLink/PreviewChrome",
  component: PreviewChrome,
  decorators: [(storyFn) => <Box w="100%">{storyFn()}</Box>],
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj<typeof PreviewChrome>

// Fixed date so Chromatic snapshots are stable.
const FIXED_EXPIRY = "2026-06-21T15:59:00Z"

export const ShortTitle: Story = {
  args: {
    pageTitle: "About Us",
    expiresAt: FIXED_EXPIRY,
  },
}

export const LongTitle: Story = {
  args: {
    pageTitle:
      "Frequently Asked Questions About the New Ministry-Wide Compliance Framework",
    expiresAt: FIXED_EXPIRY,
  },
}
