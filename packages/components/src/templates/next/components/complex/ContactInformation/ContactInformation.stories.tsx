import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { ContactInformationProps } from "~/interfaces"
import ContactInformation from "./ContactInformation"

const meta: Meta<ContactInformationProps> = {
  title: "Next/Components/ContactInformation",
  component: ContactInformation,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof ContactInformation>

export const Default: Story = {
  args: {
    country: "Singapore",
    city: "Sentosa",
    entityDetails: [
      {
        displayText: "Ambassador (Non-Resident)",
        values: ["Mr MOHAMMAD Alami Musa"],
      },
      {
        displayText: "Chancery",
        values: [
          "c/o Ministry of Foreign Affairs",
          "Tanglin",
          "Singapore 248163",
        ],
      },
    ],
    description: "Embassy of the Republic of Singapore - Algeria",
    telephone: {
      displayText: "Telephone",
      values: ["+65-63798000 (MFA)"],
    },
    fax: {
      displayText: "Fax",
      values: ["+65-64747885 (MFA)"],
    },
    email: {
      displayText: "Email",
      values: [
        "do-not-reply@isomer.gov.sg",
        "do-not-reply-pelase@isomer.gov.sg",
      ],
    },
    website: {
      displayText: "Website",
      values: ["https://www.isomer.gov.sg", "https://sample.isomer.gov.sg"],
    },
    operatingHours: {
      displayText: "Operating Hours",
      values: ["Mon - Fri", "8.30 am to 5.00 pm", "Sat & Sun - Closed"],
    },
    otherMethods: [
      {
        displayText: "Emergency Contact",
        values: [
          "https://this-should-still-be-hyperlinked.isomer.gov.sg",
          "this-should-still-be-hyperlinked@isomer.gov.sg",
          "12345678",
        ],
      },
      {
        displayText: "Telegram",
        values: ["https://t.me/isomer_gov_sg"],
      },
      {
        displayText: "WhatsApp",
        values: ["+65-63798000 (MFA)"],
      },
    ],
    otherInformation:
      "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
  },
}
