import type { Meta, StoryObj } from "@storybook/react"

import type { NotificationProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"
import Notification from "./Notification"

const meta: Meta<NotificationProps> = {
  title: "Next/Internal Components/Notification",
  component: Notification,
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
type Story = StoryObj<typeof Notification>

export const NoTitle: Story = {
  args: {
    content: [
      {
        text: "This site will be on maintenance from 0900 to 1400 (Standard Singapore Time) this Tuesday, 24th May. E-services may be intermittently available during this period. For more information, please reach out to ",
        type: "text",
      },
      {
        text: "hello@example.com",
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "mailto:hello@example.com",
              target: "_blank",
            },
          },
        ],
      },
      { text: ". ", type: "text" },
    ],
  },
}

export const ShortText: Story = {
  args: {
    content: [{ type: "text", text: "This is a short notification" }],
  },
}

export const WithTitle: Story = {
  args: {
    title: "This is a staging site for internal testing purposes.",
    content: [
      {
        text: "Contents on this site are neither accurate nor are representative of any Ministry's views. ",
        type: "text",
      },
      {
        text: "Internal link",
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "/internal-link",
            },
          },
        ],
      },
      { text: ", ", type: "text" },
      {
        text: "external link",
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://open.gov.sg/",
              target: "_blank",
            },
          },
        ],
      },
      { text: ".", type: "text" },
    ],
  },
}
