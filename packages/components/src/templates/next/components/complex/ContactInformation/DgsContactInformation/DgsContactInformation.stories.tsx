import type { Meta, StoryObj } from "@storybook/react"
import { http, HttpResponse } from "msw"

import { withChromaticModes } from "@isomer/storybook-config"

import type { ContactInformationProps } from "~/interfaces"
import { generateDgsUrl } from "~/hooks/useDgsData/fetchDataFromDgsApi"
import { DgsContactInformation } from "./DgsContactInformation"

const meta: Meta<ContactInformationProps> = {
  title: "Next/Components/ContactInformation/DGS",
  component: DgsContactInformation,
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
type Story = StoryObj<typeof DgsContactInformation>

const DgsUrl = generateDgsUrl({
  resourceId: "PLACEHOLDER_RESOURCE_ID",
  filters: {
    testFieldKey: "testFieldValue",
  },
})

const DgsParameters = {
  msw: {
    handlers: [
      http.get(DgsUrl, () =>
        HttpResponse.json({
          success: true,
          result: {
            records: [
              {
                entity_name: "Sentosa",
                description: "Embassy of the Republic of Singapore - Algeria",
                methods: JSON.stringify([
                  {
                    method: "telephone",
                    label: "Telephone",
                    values: ["+65-63798000 (MFA)"],
                  },
                  {
                    method: "fax",
                    label: "Fax",
                    values: ["+65-64747885 (MFA)"],
                    caption: "Got people use meh?",
                  },
                  {
                    method: "email",
                    label: "Email",
                    values: [
                      "do-not-reply@isomer.gov.sg",
                      "do-not-reply-pelase@isomer.gov.sg",
                    ],
                  },
                  {
                    method: "website",
                    label: "Website",
                    values: [
                      "https://www.isomer.gov.sg",
                      "https://sample.isomer.gov.sg",
                    ],
                  },
                  {
                    method: "emergency_contact",
                    label: "In the case of emergency",
                    values: ["+65 5678 1234"],
                    caption: "(after hours)",
                  },
                  {
                    method: "operating_hours",
                    label: "Operating Hours",
                    values: [
                      "Mon - Fri",
                      "8.30 am to 5.00 pm",
                      "Sat & Sun - Closed",
                    ],
                  },
                  {
                    method: "person",
                    label: "Ambassador (Non-Resident)",
                    values: ["Mr MOHAMMAD Alami Musa"],
                  },
                  {
                    method: "address",
                    label: "Chancery",
                    values: [
                      "c/o Ministry of Foreign Affairs",
                      "Tanglin",
                      "Singapore 248163",
                    ],
                  },
                  {
                    method: "other_methods",
                    label: "Telegram",
                    values: ["https://t.me/isomer_gov_sg"],
                  },
                  {
                    method: "other_methods",
                    label: "WhatsApp",
                    values: ["+65-63798000 (MFA)"],
                  },
                ]),
                other_information: JSON.stringify({
                  label:
                    "This is a customized header of a Other Information field",
                  value:
                    "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
                }),
              },
            ],
          },
        }),
      ),
    ],
  },
}

export const Default: Story = {
  parameters: DgsParameters,
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
    title: "[dgs:entity_name]", // to show that they can have different value from DGS
    description: "[dgs:description]",
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
  },
}

export const Partial: Story = {
  name: "Part Native, Part DGS",
  parameters: DgsParameters,
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
    title: "This title is not from DGS",
    description: "This description is not from DGS",
    methods: "[dgs:methods]",
    otherInformation: {
      label: "This otherInformation is not from DGS",
      value:
        "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
    },
  },
}

export const Homepage: Story = {
  parameters: DgsParameters,
  args: {
    layout: "homepage",
    whitelistedMethods: ["telephone", "emergency_contact", "email"],
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
    title: "[dgs:entity_name]",
    description: "[dgs:description]",
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
  },
}

export const LoadingDefault: Story = {
  name: "Loading (Default)",
  parameters: {
    msw: {
      handlers: [
        http.get(DgsUrl, () => {
          return new Promise(() => {
            // Never resolve the promise
          })
        }),
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
    title: "[dgs:entity_name]",
    description: "[dgs:description]",
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
  },
}

export const LoadingHomepage: Story = {
  name: "Loading (Homepage)",
  parameters: {
    msw: {
      handlers: [
        http.get(DgsUrl, () => {
          return new Promise(() => {
            // Never resolve the promise
          })
        }),
      ],
    },
  },
  args: {
    layout: "homepage",
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
    title: "[dgs:entity_name]",
    description: "[dgs:description]",
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
  },
}

// Note: should not show anything - this is intentional
export const Error: Story = {
  parameters: {
    docs: {
      description: {
        story: "Should not show anything - this is intentional",
      },
    },
    msw: {
      handlers: [
        http.get(DgsUrl, () => {
          return new HttpResponse(null, {
            status: 500,
          })
        }),
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
    title: "[dgs:entity_name]",
    description: "[dgs:description]",
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
  },
}
