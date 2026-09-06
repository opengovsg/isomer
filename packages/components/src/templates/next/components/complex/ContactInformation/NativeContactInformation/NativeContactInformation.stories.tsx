import type { Meta, StoryObj } from "@storybook/react-vite"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"

import { withChromaticModes } from "@isomer/storybook-config"

import { NativeContactInformation } from "./NativeContactInformation"

const meta: Meta<typeof NativeContactInformation> = {
  argTypes: {},
  args: generateSiteConfig(),
  component: NativeContactInformation,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Components/ContactInformation/Native",
}
export default meta
type Story = StoryObj<typeof NativeContactInformation>

export const Default: Story = {
  args: {
    description:
      "Embassy of the Republic of Singapore - Algeria<br>should NOT accept line break HTML tag",
    headingLevel: 2,
    label: "I can't even help myself",
    methods: [
      {
        label: "Permanent Representative (UN)",
        method: "person",
        values: ["Mr Umej Singh Bhatia s/o Amarjeet Singh"],
      },
      {
        label: "Address",
        method: "address",
        values: [
          "Permanent Mission of the Republic of Singapore",
          "Avenue du Pailly 10",
          "1219 Châtelaine, Geneva",
        ],
      },
      {
        label: "Tel",
        method: "telephone",
        values: ["+41-22-795-0101"],
      },
      {
        label: "Fax (General)",
        method: "fax",
        values: ["+41-22-796-8078"],
      },
      {
        label: "Fax (Consular)",
        method: "fax",
        values: ["+41-22-796-8381"],
      },
      {
        label: "Email",
        method: "email",
        values: ["MFA_GVA_UN@mfa.gov.sg"],
      },
      {
        label: "Website",
        method: "website",
        values: ["https://www.mfa.gov.sg/Geneva-UN"],
      },
      {
        label: "Operating Hours",
        method: "operating_hours",
        values: ["Mon - Fri", "8.30 am to 1.00 pm", "2.00 pm to 5.00 pm"],
      },
      {
        label: "Website",
        method: "website",
        values: [
          "https://www.exteriores.gob.es/Embajadas/singapur/es/Paginas/index.aspx",
        ],
      },
      {
        label: "Address",
        method: "address",
        values: [
          "This is a really really really long address that should be wrapped in the browser so please please please wrap it thank you",
        ],
      },
      {
        label: "This is not a valid URL",
        method: "website",
        values: ["weibo:"],
      },
    ],
    otherInformation: {
      label: "This is a customized header of a Other Information field",
      value:
        "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
    },
    title: "Sentosa",
    type: "contactinformation",
    url: "/",
  },
}

export const Homepage2Methods: Story = {
  args: {
    description:
      "This is how it looks like when there are 2 contact methods on homepage",
    headingLevel: 2,
    label: "More ways to contact us",
    layout: "homepage",
    methods: [
      {
        label: "Call us",
        method: "telephone",
        values: ["+61 2 6271 2000"],
      },
      {
        caption: "(after hours)",
        label: "In the case of emergency",
        method: "emergency_contact",
        values: ["+65 5678 1234"],
      },
    ],
    title: "Contact the High Commission of Canberra",
    type: "contactinformation",
    url: "/",
  },
  name: "Homepage (2 Methods)",
}

export const Homepage3Methods: Story = {
  args: {
    description:
      "Should only render max. 3 contact methods regardless of the number of contact methods provided",
    headingLevel: 2,
    label: "More ways to contact us",
    layout: "homepage",
    methods: [
      {
        label: "Call us",
        method: "telephone",
        values: ["+61 2 6271 2000"],
      },
      {
        caption: "(after hours)",
        label: "In the case of emergency",
        method: "emergency_contact",
        values: ["+65 5678 1234"],
      },
      {
        label: "Email us",
        method: "email",
        values: ["singhc_cbr@mfa.sg"],
      },
    ],
    title: "Contact the High Commission of Canberra",
    type: "contactinformation",
    url: "/",
  },
  name: "Homepage (3 Methods)",
}
