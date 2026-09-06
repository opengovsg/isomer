import type { Meta, StoryObj } from "@storybook/react-vite"
import type { NavbarProps } from "~/interfaces"
import { expect, userEvent, within } from "storybook/test"
import { generateSiteConfig } from "~/stories/helpers"

import { getViewportByMode, withChromaticModes } from "@isomer/storybook-config"

import { Button } from "../Button"
import { Masthead } from "../Masthead"
import { Notification } from "../Notification"
import { Navbar } from "./Navbar"

const Renderer = (props: NavbarProps) => (
  <div className="flex min-h-dvh flex-col">
    <header>
      <Masthead />
      <Navbar {...props} />
    </header>
    <div className="h-[calc(100vh+300px)] bg-red-500">
      This mimics content that may overflow in a real preview
      <div>
        <Button>Focusable button</Button>
      </div>
    </div>
  </div>
)

const RendererWithNotification = (props: NavbarProps) => (
  <div className="flex min-h-dvh flex-col">
    <header>
      <Masthead />
      <Notification
        title="This is an important site notification"
        site={generateSiteConfig()}
      />
      <Navbar {...props} />
    </header>
    <div className="h-[calc(100vh+300px)] bg-red-500">
      This mimics content that may overflow in a real preview
      <div>
        <Button>Focusable button</Button>
      </div>
    </div>
  </div>
)

const meta: Meta<NavbarProps> = {
  component: Renderer,
  parameters: {
    chromatic: {
      prefersReducedMotion: "reduce",
    },
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/Navbar",
}
export default meta
type Story = StoryObj<typeof Navbar>

const generateNavbarArgs = (
  overrides?: Partial<NavbarProps>,
): Partial<NavbarProps> => ({
  items: [
    {
      description: "This is a description of the item.",
      items: [
        {
          description:
            "Join us on our journey to improve community engagement in Singapore",
          name: "Join us",
          url: "/item-one/pa-network-one",
        },
        {
          description: "OGP Website",
          name: "External Link",
          url: "https://open.gov.sg",
        },
        {
          description: "This is our leadership and senior management team",
          name: "Our team",
          url: "/item-one/pa-network-two",
        },
        {
          name: "PA's network three",
          url: "/item-one/pa-network-three",
        },
        {
          description:
            "This one has a pretty long one. If the description gets very very long, it might be worth truncating the description at some point.",
          name: "PA's network four",
          url: "/item-one/pa-network-four",
        },
        {
          description:
            "This one has a pretty long one. If the description gets very very long, it might be worth truncating the description at some point.",
          name: "PA's network five",
          url: "/item-one/pa-network-five",
        },
        {
          name: "PA's network six",
          url: "/item-one/pa-network-six",
        },
      ],
      name: "Max 70 chars",
      url: "",
    },
    {
      description: "This navbar item has a reference link",
      items: [
        {
          description: "Click here and brace yourself for mild disappointment.",
          name: "A sub item",
          url: "/item-two/sub-item",
        },
        {
          name: "Another sub item",
          url: "/item-two/another-sub-item",
        },
      ],
      name: "Longer item with 30 characters",
      url: "/item-two",
    },
    {
      items: [
        {
          name: "A sub item",
          url: "/item-three/sub-item",
        },
        {
          description: "Click here and brace yourself for mild disappointment.",
          name: "Another sub item",
          url: "/item-three/another-sub-item",
        },
      ],
      name: "Please",
      url: "/item-three",
    },
    {
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
      name: "Test item",
      url: "/item-four",
    },
    {
      name: "eServices",
      url: "/single-item",
    },
  ],
  logoAlt: "Isomer logo",
  logoUrl: "/isomer-logo.svg",
  search: {
    searchUrl: "/search",
    type: "localSearch",
  },
  site: generateSiteConfig(),
  ...overrides,
})

// Default scenario
export const Default: Story = {
  args: generateNavbarArgs(),
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
  args: generateNavbarArgs(),
  globals: {
    viewport: getViewportByMode("desktop"),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /max 70 chars/iu }),
    )

    const text = await canvas.findByText("This is a description of the item.")
    await expect(text).toBeVisible()
  },
}

export const ExpandNavbarItemWithLink: Story = {
  args: generateNavbarArgs(),
  globals: {
    viewport: getViewportByMode("desktop"),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /Longer item with 30 characters/iu }),
    )

    const text = await canvas.findByText(
      "This navbar item has a reference link",
    )
    await expect(text).toBeVisible()
  },
}

export const ExpandSearch: Story = {
  args: generateNavbarArgs(),
  parameters: Default.parameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open search bar/iu }),
    )

    const text = await canvas.findByPlaceholderText("Search this site")
    await expect(text).toBeVisible()
  },
}

export const Mobile: Story = {
  args: generateNavbarArgs(),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
  },
}

export const ExpandMobile: Story = {
  args: generateNavbarArgs(),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
    await userEvent.click(
      canvas.getByRole("button", { name: /max 70 chars/iu }),
    )
  },
}

export const MobileCallToAction: Story = {
  args: generateNavbarArgs({
    callToAction: {
      label: "Login to Donation Portal",
      url: "/call-to-action",
    },
  }),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
  },
}

export const ExpandMobileWithLinkOneWord: Story = {
  args: generateNavbarArgs(),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  name: "Expand Mobile With Link (one word)",
  parameters: {
    chromatic: withChromaticModes(["mobileSmall", "mobile"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
    await userEvent.click(canvas.getByRole("button", { name: /Please/iu }))
  },
}

export const ExpandMobileWithLinkMultipleWords: Story = {
  args: generateNavbarArgs(),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  name: "Expand Mobile With Link (multiple words)",
  parameters: {
    chromatic: withChromaticModes(["mobileSmall", "mobile"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
    await userEvent.click(
      canvas.getByRole("button", { name: /Longer item with 30 characters/iu }),
    )
  },
}

export const UtilityLinksDesktop: Story = {
  args: generateNavbarArgs({
    utility: {
      items: [
        { name: "First link", url: "/link-1" },
        { name: "Linkedua", url: "/link-2" },
        { name: "Link 3", url: "/link-3" },
        { name: "Quad link", url: "/link-4" },
      ],
      label: "Custom label",
    },
  }),
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
}

export const UtilityLinksMobile: Story = {
  args: generateNavbarArgs({
    utility: {
      items: [
        { name: "Link 1", url: "/link-1" },
        { name: "Link 2", url: "/link-2" },
        { name: "Link 3", url: "/link-3" },
      ],
      label: "Quick links",
    },
  }),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  parameters: {
    chromatic: withChromaticModes(["mobileSmall", "mobile"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
  },
}

export const UtilityLinksNoLabelDesktop: Story = {
  args: generateNavbarArgs({
    utility: {
      items: [
        { name: "First link", url: "/link-1" },
        { name: "Linkedua", url: "/link-2" },
        { name: "Link 3", url: "/link-3" },
        { name: "Quad link", url: "/link-4" },
      ],
    },
  }),
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
}

export const UtilityLinksNoLabelMobile: Story = {
  args: generateNavbarArgs({
    utility: {
      items: [
        { name: "Link 1", url: "/link-1" },
        { name: "Link 2", url: "/link-2" },
        { name: "Link 3", url: "/link-3" },
      ],
    },
  }),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  parameters: {
    chromatic: withChromaticModes(["mobileSmall", "mobile"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
  },
}

export const CTAAndUtilityLinksDesktop: Story = {
  args: generateNavbarArgs({
    callToAction: {
      label: "Login to Donation Portal",
      url: "/call-to-action",
    },
    utility: {
      items: [
        { name: "First link", url: "/link-1" },
        { name: "Linkedua", url: "/link-2" },
        { name: "Link 3", url: "/link-3" },
        { name: "Quad link", url: "/link-4" },
      ],
      label: "Custom label",
    },
  }),
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
  },
}

export const CTAAndUtilityLinksMobile: Story = {
  args: generateNavbarArgs({
    callToAction: {
      label: "Login to Donation Portal",
      url: "/call-to-action",
    },
    utility: {
      items: [
        { name: "Link 1", url: "/link-1" },
        { name: "Link 2", url: "/link-2" },
        { name: "Link 3", url: "/link-3" },
      ],
      label: "Quick links",
    },
  }),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  parameters: {
    chromatic: withChromaticModes(["mobileSmall", "mobile"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
  },
}

// Pinned CTA stories — isPinnedOnMobile: true

export const PinnedCTA: Story = {
  args: generateNavbarArgs({
    callToAction: {
      isPinnedOnMobile: true,
      label: "Report Now",
      url: "/report",
    },
  }),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  parameters: {
    chromatic: withChromaticModes(["desktop", "mobile"]),
  },
}

export const PinnedCTAMobileExpanded: Story = {
  args: generateNavbarArgs({
    callToAction: {
      isPinnedOnMobile: true,
      label: "Report Now",
      url: "/report",
    },
    utility: {
      items: [
        { name: "Link 1", url: "/link-1" },
        { name: "Link 2", url: "/link-2" },
        { name: "Link 3", url: "/link-3" },
      ],
      label: "Quick links",
    },
  }),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  parameters: {
    chromatic: withChromaticModes(["mobileSmall", "mobile"]),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
  },
}

export const PinnedCTATruncatedLabel: Story = {
  args: generateNavbarArgs({
    callToAction: {
      isPinnedOnMobile: true,
      label: "Report a Safety Incident",
      url: "/report",
    },
  }),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  name: "Pinned CTA — 25-char label (truncation)",
  parameters: {
    chromatic: withChromaticModes(["mobileSmall", "mobile"]),
  },
}

// Regression tests for https://github.com/opengovsg/isomer/issues/2120:
// the mobile menu's `top` should update when masthead/notification height changes
// while the menu is open.

const mobileRegressionBase: Story = {
  args: generateNavbarArgs(),
  globals: {
    viewport: getViewportByMode("mobile"),
  },
  parameters: {
    chromatic: withChromaticModes(["mobile"]),
  },
}

const mobileRegressionWithNotificationBase: Story = {
  ...mobileRegressionBase,
  beforeEach: () => {
    sessionStorage.removeItem("notification-dismissed")
  },
  render: (args) => <RendererWithNotification {...args} />,
}

export const MobileNavbarAfterMastheadCollapsed: Story = {
  ...mobileRegressionBase,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText(/how to identify/iu))
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
    await userEvent.click(canvas.getByText(/how to identify/iu))
  },
}

export const MobileNavbarAfterNotificationDismissed: Story = {
  ...mobileRegressionWithNotificationBase,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
    await userEvent.click(
      canvas.getByRole("button", { name: /dismiss notification/iu }),
    )
  },
}

export const MobileNavbarAfterMastheadAndNotificationClosed: Story = {
  ...mobileRegressionWithNotificationBase,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText(/how to identify/iu))
    await userEvent.click(
      canvas.getByRole("button", { name: /open navigation menu/iu }),
    )
    await userEvent.click(canvas.getByText(/how to identify/iu))
    await userEvent.click(
      canvas.getByRole("button", { name: /dismiss notification/iu }),
    )
  },
}
