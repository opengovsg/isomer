import type { Meta, StoryObj } from "@storybook/react-vite"
import type { NotificationProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { Notification } from "./Notification"

const meta: Meta<NotificationProps> = {
  title: "Next/Internal Components/Notification",
  component: Notification,
  argTypes: {},
  parameters: {
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
    chromatic: withChromaticModes(["desktop", "tablet", "mobile"]),
  },
  args: {
    site: generateSiteConfig(),
  },
}
export default meta
type Story = StoryObj<typeof Notification>

export const TitleAndDescription: Story = {
  args: {
    title: "This is a staging site for internal testing purposes.",
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
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
      ],
    },
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
    title:
      "This is a staging site for internal testing purposes. You should not use this site for any official purposes. This is a long title that spans multiple lines.",
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              text: "Contents on this site are neither accurate nor are representative of any Ministry's views. It may contain outdated or incorrect information. For accurate information, go to individual agency websites. ",
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
      ],
    },
  },
}

export const Antiscam: Story = {
  args: {
    type: "antiscam",
  },
}
