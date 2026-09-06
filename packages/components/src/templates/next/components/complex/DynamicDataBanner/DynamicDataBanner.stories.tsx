/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-deprecated -- story/test fixtures use narrowed mock shapes */
import type { Meta, StoryObj } from "@storybook/react-vite"
import { http, HttpResponse } from "msw"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { DynamicDataBanner } from "./DynamicDataBanner"
import { getSingaporeDateYYYYMMDD } from "./utils"

const meta: Meta<typeof DynamicDataBanner> = {
  args: {
    apiEndpoint: "https://jsonplaceholder.com/muis_prayers_time",
    data: [
      {
        key: "subuh",
        label: "Subuh",
      },
      {
        key: "syuruk",
        label: "Syuruk",
      },
      {
        key: "zohor",
        label: "Zohor",
      },
      {
        key: "asar",
        label: "Asar",
      },
      {
        key: "maghrib",
        label: "Maghrib",
      },
      {
        key: "isyak",
        label: "Ishak",
      },
    ],
    errorMessage: [
      {
        text: "Couldn't load prayer times. Try refreshing the page.",
        type: "text",
      },
    ],
    label: "View all dates",
    site: generateSiteConfig(),
    title: "hijriDate",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  component: DynamicDataBanner,
  parameters: {
    chromatic: withChromaticModes([
      "mobileSmall",
      "mobile",
      "tablet",
      "desktop",
    ]),
    layout: "fullscreen",
  },
  title: "Next/Components/DynamicDataBanner",
}

export default meta
type Story = StoryObj<typeof DynamicDataBanner>

export const Default: Story = {
  decorators: [
    (Story) => (
      <div
        style={
          // SAFETY: CSS custom properties are valid at runtime but omitted from React.CSSProperties
          {
            "--color-brand-interaction-hover": "#00422C",
          } as React.CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.get("https://jsonplaceholder.com/muis_prayers_time", () =>
          HttpResponse.json({
            [getSingaporeDateYYYYMMDD()]: {
              asar: "4:34pm",
              hijriDate: "17 Jamadilawal 1442H",
              isyak: "8:25pm",
              maghrib: "7:11pm",
              subuh: "5:44am",
              syuruk: "7:08am",
              zohor: "1:10pm",
            },
          }),
        ),
      ],
    },
  },
}

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(
          "https://jsonplaceholder.com/muis_prayers_time",
          async () =>
            await new Promise(() => {
              // Never resolve the promise
            }),
        ),
      ],
    },
  },
}

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(
          "https://jsonplaceholder.com/muis_prayers_time",
          () =>
            new HttpResponse(null, {
              status: 500,
            }),
        ),
      ],
    },
  },
}
