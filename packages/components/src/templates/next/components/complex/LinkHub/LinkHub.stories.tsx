import type { Meta, StoryObj } from "@storybook/react-vite"
import type { LinkHubProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { LinkHub } from "./LinkHub"

const meta: Meta<LinkHubProps> = {
  title: "Next/Components/LinkHub",
  component: LinkHub,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
  },
}
export default meta
type Story = StoryObj<typeof LinkHub>

const links: LinkHubProps["links"] = [
  { title: "Apply for a permit", url: "/permits/apply" },
  { title: "Download the application form", url: "/files/application-form" },
  { title: "Email us your questions", url: "mailto:enquiries@isomer.gov.sg" },
  { title: "Report scams on ScamShield", url: "tel:1799" },
]

export const Default: Story = {
  args: {
    title: "Quick links",
    description: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Here are some links to help you get started.",
            },
          ],
        },
      ],
    },
    variant: "vertical",
    links,
  },
}

export const HorizontalVariant: Story = {
  name: "Horizontal variant",
  args: {
    title: "Quick links",
    description: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Here are some links to help you get started.",
            },
          ],
        },
      ],
    },
    variant: "horizontal",
    links,
  },
}

export const NoTitleOrDescription: Story = {
  name: "No title or description",
  args: {
    links,
  },
}
