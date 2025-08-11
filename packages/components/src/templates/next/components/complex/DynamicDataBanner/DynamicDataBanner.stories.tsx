import type { Meta, StoryObj } from "@storybook/react"
import { http, HttpResponse } from "msw"

import { withChromaticModes } from "@isomer/storybook-config"

import { generateSiteConfig } from "~/stories/helpers"
import { DynamicDataBanner } from "./DynamicDataBanner"
import { getSingaporeDateYYYYMMDD } from "./utils"

const meta: Meta<typeof DynamicDataBanner> = {
  title: "Next/Components/DynamicDataBanner",
  component: DynamicDataBanner,
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes([
      "mobileSmall",
      "mobile",
      "tablet",
      "desktop",
    ]),
  },
  args: {
    site: generateSiteConfig(),
    apiEndpoint: "https://jsonplaceholder.com/muis_prayers_time",
    title: "hijriDate",
    data: [
      {
        label: "Subuh",
        key: "subuh",
      },
      {
        label: "Syuruk",
        key: "syuruk",
      },
      {
        label: "Zohor",
        key: "zohor",
      },
      {
        label: "Asar",
        key: "asar",
      },
      {
        label: "Maghrib",
        key: "maghrib",
      },
      {
        label: "Ishak",
        key: "isyak",
      },
    ],
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    label: "View all dates",
    errorMessage: [
      {
        text: "Couldn't load prayer times. Try refreshing the page.",
        type: "text",
      },
    ],
  },
}

export default meta
type Story = StoryObj<typeof DynamicDataBanner>

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("https://jsonplaceholder.com/muis_prayers_time", () => {
          return HttpResponse.json({
            [getSingaporeDateYYYYMMDD()]: {
              hijriDate: "17 Jamadilawal 1442H",
              subuh: "5:44am",
              syuruk: "7:08am",
              zohor: "1:10pm",
              asar: "4:34pm",
              maghrib: "7:11pm",
              isyak: "8:25pm",
            },
          })
        }),
      ],
    },
  },
  decorators: [
    (Story) => (
      <div
        style={
          {
            "--color-brand-interaction-hover": "#00422C",
          } as React.CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("https://jsonplaceholder.com/muis_prayers_time", () => {
          return new Promise(() => {
            // Never resolve the promise
          })
        }),
      ],
    },
  },
}

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("https://jsonplaceholder.com/muis_prayers_time", () => {
          return new HttpResponse(null, {
            status: 500,
          })
        }),
      ],
    },
  },
}
