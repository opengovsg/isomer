import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import { DynamicDataBannerClient } from "./DynamicDataBannerClient"
import { getSingaporeDateYYYYMMDD } from "./utils"

const meta: Meta<typeof DynamicDataBannerClient> = {
  title: "Next/Components/DynamicDataBanner",
  component: DynamicDataBannerClient,
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
  },
}

export default meta
type Story = StoryObj<typeof DynamicDataBannerClient>

const generateArgs = () => {
  return {
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
  }
}

export const Default: Story = {
  parameters: {
    mockData: [
      {
        url: "https://jsonplaceholder.com/muis_prayers_time",
        method: "GET",
        status: 200,
        response: {
          [getSingaporeDateYYYYMMDD()]: {
            hijriDate: "17 Jamadilawal 1442H",
            subuh: "5:44am",
            syuruk: "7:08am",
            zohor: "1:10pm",
            asar: "4:34pm",
            maghrib: "7:11pm",
            isyak: "8:25pm",
          },
        },
      },
    ],
  },
  args: generateArgs(),
}

export const Error: Story = {
  parameters: {
    mockData: [
      {
        url: "https://jsonplaceholder.com/muis_prayers_time",
        method: "GET",
        status: 500,
        response: {},
      },
    ],
  },
  args: generateArgs(),
}
