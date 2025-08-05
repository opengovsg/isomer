import type { Meta, StoryObj } from "@storybook/react"

import type { CalloutProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"
import Callout from "./Callout"

const meta: Meta<CalloutProps> = {
  title: "Next/Components/Callout",
  component: Callout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Callout>

// Default scenario
export const Default: Story = {
  args: {
    site: generateSiteConfig(),
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
            },
          ],
        },
      ],
    },
  },
}
