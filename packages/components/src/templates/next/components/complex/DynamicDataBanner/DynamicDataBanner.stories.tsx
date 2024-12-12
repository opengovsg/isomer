import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import { DynamicDataBanner } from "./DynamicDataBanner"
import { getSingaporeDateYYYYMMDD } from "./utils"

const meta: Meta<typeof DynamicDataBanner> = {
  title: "Next/Components/DynamicDataBanner",
  component: DynamicDataBanner,
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
  },
  args: {
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "searchSG",
        clientId: "",
      },
    },
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
        text: "Not seeing the prayer times? ",
        type: "text",
      },
      {
        text: "Report an issue",
        type: "text",
        marks: [
          { type: "bold" },
          {
            type: "link",
            attrs: {
              href: "https://www.form.gov.sg/some-link",
            },
          },
        ],
      },
    ],
  },
}

export default meta
type Story = StoryObj<typeof DynamicDataBanner>

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
}
