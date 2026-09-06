import type { Meta, StoryObj } from "@storybook/react-vite"
import type { NotificationProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Notification } from "./Notification"

const meta: Meta<NotificationProps> = {
  argTypes: {},
  args: {
    site: generateSiteConfig(),
  },
  component: Notification,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/Notification",
}
export default meta
type Story = StoryObj<typeof Notification>

export const TitleAndDescription: Story = {
  args: {
    content: {
      content: [
        {
          content: [
            {
              text: "Contents on this site are neither accurate nor are representative of any Ministry's views. ",
              type: "text",
            },
            {
              marks: [
                {
                  attrs: {
                    href: "/internal-link",
                  },
                  type: "link",
                },
              ],
              text: "Internal link",
              type: "text",
            },
            { text: ", ", type: "text" },
            {
              marks: [
                {
                  attrs: {
                    href: "https://open.gov.sg/",
                    target: "_blank",
                  },
                  type: "link",
                },
              ],
              text: "external link",
              type: "text",
            },
            { text: ".", type: "text" },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    title: "This is a staging site for internal testing purposes.",
  },
}

export const ShortTitle: Story = {
  args: {
    title: "Short notification with just a title. Description is optional.",
  },
}

export const LongTitle: Story = {
  args: {
    title:
      "This is a staging site for internal testing purposes. You should not use this site for any official purposes. This is a long title that spans multiple lines.",
  },
}

export const LongContent: Story = {
  args: {
    content: {
      content: [
        {
          content: [
            {
              text: "Contents on this site are neither accurate nor are representative of any Ministry's views. It may contain outdated or incorrect information. For accurate information, go to individual agency websites. ",
              type: "text",
            },
            {
              marks: [
                {
                  attrs: {
                    href: "/internal-link",
                  },
                  type: "link",
                },
              ],
              text: "Internal link",
              type: "text",
            },
            { text: ", ", type: "text" },
            {
              marks: [
                {
                  attrs: {
                    href: "https://open.gov.sg/",
                    target: "_blank",
                  },
                  type: "link",
                },
              ],
              text: "external link",
              type: "text",
            },
            { text: ".", type: "text" },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    title:
      "This is a staging site for internal testing purposes. You should not use this site for any official purposes. This is a long title that spans multiple lines.",
  },
}
