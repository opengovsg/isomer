import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "@storybook/test"

import { getViewportByMode, withChromaticModes } from "@isomer/storybook-config"

import type { NavbarProps } from "~/interfaces"
import { Button } from "../Button"
import Masthead from "../Masthead"
import Navbar from "./Navbar"

const Renderer = (props: NavbarProps) => {
  return (
    <div className="flex min-h-dvh flex-col">
      <Masthead />
      <Navbar {...props} />
      <div className="h-[calc(100vh+300px)] bg-red-500">
        This mimics content that may overflow in a real preview
        <div>
          <Button>Focusable button</Button>
        </div>
      </div>
    </div>
  )
}

const meta: Meta<NavbarProps> = {
  title: "Next/Internal Components/Navbar",
  component: Renderer,
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

const generateNavbarArgs = ({
  callToAction = undefined,
}: {
  callToAction?: {
    label: string
    url: string
  }
}): Partial<NavbarProps> => {
  return {
    logoUrl: "/isomer-logo.svg",
    logoAlt: "Isomer logo",
    search: {
      type: "localSearch",
      searchUrl: "/search",
    },
    items: [
      {
        name: "Max 70 chars",
        description: "This is a description of the item.",
        url: "",
        items: [
          {
            name: "Join us",
            url: "/item-one/pa-network-one",
            description:
              "Join us on our journey to improve community engagement in Singapore",
          },
          {
            name: "External Link",
            url: "https://open.gov.sg",
            description: "OGP Website",
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
        name: "Longer item with 30 characters",
        url: "/item-two",
        description: "This navbar item has a reference link",
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
        name: "Please",
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
        name: "Test item",
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
        name: "eServices",
        url: "/single-item",
      },
    ],
    callToAction,
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [],
      },
      theme: "isomer-next",
      isGovernment: true,
      url: "https://www.isomer.gov.sg",
      logoUrl: "/isomer-logo.svg",
      lastUpdated: "2021-10-01",
      navbar: { items: [] },
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
  }
}

// Default scenario
export const Default: Story = {
  args: generateNavbarArgs({}),
  parameters: {
    chromatic: {
      ...withChromaticModes(["desktop", "mobile"]),
    },
  },
}

export const CallToAction: Story = {
  args: generateNavbarArgs({
    callToAction: {
      label: "Login to Donation Portal",
      url: "/call-to-action",
    },
  }),
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
}

export const ExpandFirstItem: Story = {
  args: generateNavbarArgs({}),
  parameters: {
    viewport: {
      defaultViewport: getViewportByMode("desktop"),
    },
    chromatic: withChromaticModes(["desktop"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: /max 70 chars/i }))

    const text = await canvas.findByText("This is a description of the item.")
    await expect(text).toBeVisible()
  },
}

export const ExpandNavbarItemWithLink: Story = {
  args: generateNavbarArgs({}),
  parameters: {
    viewport: {
      defaultViewport: getViewportByMode("desktop"),
    },
    chromatic: withChromaticModes(["desktop"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /Longer item with 30 characters/i }),
    )

    const text = await canvas.findByText(
      "This navbar item has a reference link",
    )
    await expect(text).toBeVisible()
  },
}

export const ExpandSearch: Story = {
  args: generateNavbarArgs({}),
  parameters: Default.parameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open search bar/i }),
    )

    const text = await canvas.findByPlaceholderText("Search this site")
    await expect(text).toBeVisible()
  },
}

export const Mobile: Story = {
  args: generateNavbarArgs({}),
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
  },
}

export const ExpandMobile: Story = {
  args: generateNavbarArgs({}),
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
    await userEvent.click(canvas.getByRole("button", { name: /max 70 chars/i }))
  },
}

export const MobileCallToAction: Story = {
  args: generateNavbarArgs({
    callToAction: {
      label: "Login to Donation Portal",
      url: "/call-to-action",
    },
  }),
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
  },
}

export const ExpandMobileWithLinkOneWord: Story = {
  name: "Expand Mobile With Link (one word)",
  args: generateNavbarArgs({}),
  parameters: {
    chromatic: withChromaticModes(["mobileSmall", "mobile"]),
    viewport: {
      defaultViewport: getViewportByMode("mobile"),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/i }),
    )
    await userEvent.click(canvas.getByRole("button", { name: /Please/i }))
  },
}

export const ExpandMobileWithLinkMultipleWords: Story = {
  name: "Expand Mobile With Link (multiple words)",
  args: generateNavbarArgs({}),
  parameters: {
    chromatic: withChromaticModes(["mobileSmall", "mobile"]),
    viewport: {
      defaultViewport: getViewportByMode("mobile"),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/i }),
    )
    await userEvent.click(
      canvas.getByRole("button", { name: /Longer item with 30 characters/i }),
    )
  },
}
