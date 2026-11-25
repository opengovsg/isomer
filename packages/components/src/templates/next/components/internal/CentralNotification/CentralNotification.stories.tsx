import type { Meta, StoryObj } from "@storybook/react-vite"
import type {
  CentralNotificationBroadcast,
  CentralNotificationProps,
} from "~/interfaces"
import { http, HttpResponse } from "msw"
import { generateSiteConfig } from "~/stories/helpers"

import { withArgosModes } from "@isomer/storybook-config"

import { Notification } from "../Notification"
import { CentralNotification } from "./CentralNotification"

const ASSETS_BASE_URL = "https://assets.isomer.gov.sg"
const site = { ...generateSiteConfig(), assetsBaseUrl: ASSETS_BASE_URL }

const BROADCAST: CentralNotificationBroadcast = [
  {
    notification: {
      title: "Haze advisory: please take care of yourself and your loved ones",
      content: [
        {
          type: "text",
          text: "Reduce prolonged or strenuous outdoor activity and stay hydrated. For the latest readings, visit ",
        },
        {
          type: "text",
          text: "haze.gov.sg",
          marks: [
            {
              type: "link",
              attrs: { href: "https://www.haze.gov.sg", target: "_blank" },
            },
          ],
        },
        { type: "text", text: "." },
      ],
    },
    targetSites: [site.url],
  },
]

const meta: Meta<CentralNotificationProps> = {
  title: "Next/Internal Components/CentralNotification",
  component: CentralNotification,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
    msw: {
      handlers: [
        http.get(`${ASSETS_BASE_URL}/central-notification.json`, () =>
          HttpResponse.json(BROADCAST),
        ),
      ],
    },
  },
  args: {
    site,
  },
}
export default meta
type Story = StoryObj<typeof CentralNotification>

export const Default: Story = {
  parameters: {
    argos: withArgosModes(["desktop", "mobile"]),
  },
}

// Mirrors Skeleton, where both banners can stack.
export const WithSiteNotification: Story = {
  render: (args) => (
    <>
      <CentralNotification {...args} />
      <Notification title="This is a site notification." site={args.site} />
    </>
  ),
}
