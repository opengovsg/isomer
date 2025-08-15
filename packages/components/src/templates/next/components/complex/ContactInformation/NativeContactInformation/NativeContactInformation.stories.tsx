import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { ContactInformationProps } from "~/interfaces"
import { NativeContactInformation } from "./NativeContactInformation"

const meta: Meta<ContactInformationProps> = {
  title: "Next/Components/ContactInformation/Native",
  component: NativeContactInformation,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
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
  },
}
export default meta
type Story = StoryObj<typeof NativeContactInformation>

export const Default: Story = {
  args: {
    type: "contactinformation",
    title: "Sentosa",
    description:
      "Embassy of the Republic of Singapore - Algeria<br>should NOT accept line break HTML tag",
    methods: [
      {
        method: "person",
        label: "Permanent Representative (UN)",
        values: ["Mr Umej Singh Bhatia s/o Amarjeet Singh"],
      },
      {
        method: "address",
        label: "Address",
        values: [
          "Permanent Mission of the Republic of Singapore",
          "Avenue du Pailly 10",
          "1219 Châtelaine, Geneva",
        ],
      },
      {
        method: "telephone",
        label: "Tel",
        values: ["+41-22-795-0101"],
      },
      {
        method: "fax",
        label: "Fax (General)",
        values: ["+41-22-796-8078"],
      },
      {
        method: "fax",
        label: "Fax (Consular)",
        values: ["+41-22-796-8381"],
      },
      {
        method: "email",
        label: "Email",
        values: ["MFA_GVA_UN@mfa.gov.sg"],
      },
      {
        method: "website",
        label: "Website",
        values: ["https://www.mfa.gov.sg/Geneva-UN"],
      },
      {
        method: "operating_hours",
        label: "Operating Hours",
        values: ["Mon - Fri", "8.30 am to 1.00 pm", "2.00 pm to 5.00 pm"],
      },
    ],
    otherInformation: {
      label: "This is a customized header of a Other Information field",
      value:
        "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
    },
    url: "/",
    label: "I can't even help myself",
  },
}

export const Homepage2Methods: Story = {
  name: "Homepage (2 Methods)",
  args: {
    type: "contactinformation",
    layout: "homepage",
    title: "Contact the High Commission of Canberra",
    description:
      "This is how it looks like when there are 2 contact methods on homepage",
    methods: [
      {
        method: "telephone",
        label: "Call us",
        values: ["+61 2 6271 2000"],
      },
      {
        method: "emergency_contact",
        label: "In the case of emergency",
        values: ["+65 5678 1234"],
        caption: "(after hours)",
      },
    ],
    url: "/",
    label: "More ways to contact us",
  },
}

export const Homepage3Methods: Story = {
  name: "Homepage (3 Methods)",
  args: {
    type: "contactinformation",
    layout: "homepage",
    title: "Contact the High Commission of Canberra",
    description:
      "Should only render max. 3 contact methods regardless of the number of contact methods provided",
    methods: [
      {
        method: "telephone",
        label: "Call us",
        values: ["+61 2 6271 2000"],
      },
      {
        method: "emergency_contact",
        label: "In the case of emergency",
        values: ["+65 5678 1234"],
        caption: "(after hours)",
      },
      {
        method: "email",
        label: "Email us",
        values: ["singhc_cbr@mfa.sg"],
      },
    ],
    url: "/",
    label: "More ways to contact us",
  },
}
