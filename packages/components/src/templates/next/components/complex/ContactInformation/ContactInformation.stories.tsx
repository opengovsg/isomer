import type { Meta, StoryObj } from "@storybook/react"
import { http, HttpResponse } from "msw"

import { withChromaticModes } from "@isomer/storybook-config"

import type { ContactInformationProps } from "~/interfaces"
import { generateDgsUrl } from "~/hooks/useDgsData/fetchDataFromDgsApi"
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
    entityName: "Sentosa",
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

export const Dgs: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(
          generateDgsUrl({
            resourceId: "PLACEHOLDER_RESOURCE_ID",
            filters: {
              testFieldKey: "testFieldValue",
            },
          }),
          () => {
            return HttpResponse.json({
              success: true,
              result: {
                records: [
                  {
                    country: "Singapore",
                    entity_name: "Sentosa",
                    description:
                      "Embassy of the Republic of Singapore - Algeria",
                    telephone: JSON.stringify({
                      displayText: "Telephone",
                      values: ["+65-63798000 (MFA)"],
                    }),
                    fax: JSON.stringify({
                      displayText: "Fax",
                      values: ["+65-64747885 (MFA)"],
                    }),
                    email: JSON.stringify({
                      displayText: "Email",
                      values: [
                        "do-not-reply@isomer.gov.sg",
                        "do-not-reply-pelase@isomer.gov.sg",
                      ],
                    }),
                    website: JSON.stringify({
                      displayText: "Website",
                      values: [
                        "https://www.isomer.gov.sg",
                        "https://sample.isomer.gov.sg",
                      ],
                    }),
                    operating_hours: JSON.stringify({
                      displayText: "Operating Hours",
                      values: [
                        "Mon - Fri",
                        "8.30 am to 5.00 pm",
                        "Sat & Sun - Closed",
                      ],
                    }),
                    entity_details: JSON.stringify([
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
                    ]),
                    other_methods: JSON.stringify([
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
                    ]),
                    other_information:
                      "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
                  },
                ],
              },
            })
          },
        ),
      ],
    },
  },
  args: {
    dataSource: {
      type: "dgs",
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      filters: [
        {
          fieldKey: "testFieldKey",
          fieldValue: "testFieldValue",
        },
      ],
    },
    country: "[dgs:country]",
    entityName: "[dgs:entity_name]",
    description: "[dgs:description]",
    telephone: "[dgs:telephone]",
    fax: "[dgs:fax]",
    email: "[dgs:email]",
    website: "[dgs:website]",
    operatingHours: "[dgs:operating_hours]",
    entityDetails: "[dgs:entity_details]",
    otherMethods: "[dgs:other_methods]",
    otherInformation: "[dgs:other_information]",
  },
}
