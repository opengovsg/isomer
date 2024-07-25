import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"

import { getViewportByMode, withChromaticModes } from "@isomer/storybook-config"

import type { NavbarProps } from "~/interfaces"
import Navbar from "./Navbar"

const meta: Meta<NavbarProps> = {
  title: "Next/Internal Components/Navbar",
  component: Navbar,
  args: {
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    logoAlt: "Isomer logo",
    search: {
      type: "localSearch",
      searchUrl: "/search",
    },
    items: [
      {
        name: "About us",
        description: "This is a description of the item.",
        url: "/item-one",
        items: [
          {
            name: "Join us",
            url: "/item-one/pa-network-one",
            description:
              "Join us on our journey to improve community engagement in Singapore",
          },
          {
            name: "Our team",
            url: "/item-one/pa-network-two",
            description: "This is our leadership and senior management team",
          },
          {
            name: "PA's network three",
            url: "/item-one/pa-network-three",
          },
          {
            name: "PA's network four",
            url: "/item-one/pa-network-four",
            description:
              "This one has a pretty long one. If the description gets very very long, it might be worth truncating the description at some point.",
          },
          {
            name: "PA's network five",
            url: "/item-one/pa-network-five",
            description:
              "This one has a pretty long one. If the description gets very very long, it might be worth truncating the description at some point.",
          },
          {
            name: "PA's network six",
            url: "/item-one/pa-network-six",
          },
        ],
      },
      {
        name: "Industries",
        url: "/item-two",
        description: "This is a description of the item.",
        items: [
          {
            name: "A sub item",
            url: "/item-two/sub-item",
            description:
              "Click here and brace yourself for mild disappointment.",
          },
          {
            name: "Another sub item",
            url: "/item-two/another-sub-item",
          },
        ],
      },
      {
        name: "Media",
        url: "/item-three",
        items: [
          {
            name: "A sub item",
            url: "/item-three/sub-item",
          },
          {
            name: "Another sub item",
            url: "/item-three/another-sub-item",
            description:
              "Click here and brace yourself for mild disappointment.",
          },
        ],
      },
      {
        name: "Careers",
        url: "/item-four",
        items: [
          {
            name: "A sub item",
            url: "/item-four/sub-item",
          },
          {
            name: "Another sub item",
            url: "/item-four/another-sub-item",
          },
        ],
      },
      {
        name: "Publications",
        url: "/item-five",
        items: [
          {
            name: "A sub item",
            url: "/item-five/sub-item",
          },
          {
            name: "Another sub item",
            url: "/item-five/another-sub-item",
          },
        ],
      },
      {
        name: "Newsroom",
        url: "/item-six",
        items: [
          {
            name: "A sub item",
            url: "/item-six/sub-item",
          },
          {
            name: "Another sub item",
            url: "/item-six/another-sub-item",
          },
        ],
      },
      {
        name: "Contact us",
        url: "/single-item",
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
    chromatic: {
      prefersReducedMotion: "reduce",
    },
  },
}
export default meta
type Story = StoryObj<typeof Navbar>

// Default scenario
export const Default: Story = {
  parameters: {
    chromatic: {
      ...withChromaticModes(["desktop", "mobile"]),
    },
  },
}

export const ExpandFirstItem: Story = {
  parameters: {
    viewport: {
      defaultViewport: getViewportByMode("desktop"),
    },
    chromatic: withChromaticModes(["desktop"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: /about us/i }))
  },
}

export const ExpandSearch: Story = {
  parameters: Default.parameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open search bar/i }),
    )
  },
}

export const ExpandMobile: Story = {
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
    viewport: {
      defaultViewport: getViewportByMode("mobile"),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/i }),
    )
    await userEvent.click(canvas.getByRole("button", { name: /about us/i }))
  },
}
