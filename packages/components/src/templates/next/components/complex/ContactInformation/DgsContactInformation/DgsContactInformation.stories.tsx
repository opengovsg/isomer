import type { Meta, StoryObj } from "@storybook/react-vite"
import { delay, http, HttpResponse } from "msw"
import { generateDgsUrl } from "~/hooks/useDgsData/generateDgsUrl"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"

import { withChromaticModes } from "@isomer/storybook-config"

import { DgsContactInformation } from "./DgsContactInformation"

const meta: Meta<typeof DgsContactInformation> = {
  argTypes: {},
  component: DgsContactInformation,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Components/ContactInformation/DGS",
}
export default meta
type Story = StoryObj<typeof DgsContactInformation>

const DgsUrl = generateDgsUrl({
  filters: {
    testFieldKey: "testFieldValue",
  },
  resourceId: "PLACEHOLDER_RESOURCE_ID",
})

const DgsParameters = {
  msw: {
    handlers: [
      http.get(DgsUrl, () =>
        HttpResponse.json({
          result: {
            records: [
              {
                description:
                  "Embassy of the Republic of Singapore - Algeria<br>should accept line break HTM tag",
                entity_name: "Sentosa",
                methods: JSON.stringify([
                  {
                    label: "Telephone",
                    method: "telephone",
                    values: ["+65-63798000 (MFA)"],
                  },
                  {
                    caption: "Got people use meh?",
                    label: "Fax",
                    method: "fax",
                    values: ["+65-64747885 (MFA)"],
                  },
                  {
                    label: "Email",
                    method: "email",
                    values: [
                      "do-not-reply@isomer.gov.sg",
                      "do-not-reply-pelase@isomer.gov.sg",
                    ],
                  },
                  {
                    label: "Website",
                    method: "website",
                    values: [
                      "https://www.isomer.gov.sg",
                      "https://sample.isomer.gov.sg",
                    ],
                  },
                  {
                    caption: "(after hours)",
                    label: "In the case of emergency",
                    method: "emergency_contact",
                    values: ["+65 5678 1234"],
                  },
                  {
                    label: "Operating Hours",
                    method: "operating_hours",
                    values: [
                      "Mon - Fri",
                      "8.30 am to 5.00 pm",
                      "Sat & Sun - Closed",
                    ],
                  },
                  {
                    label: "Ambassador (Non-Resident)",
                    method: "person",
                    values: ["Mr MOHAMMAD Alami Musa"],
                  },
                  {
                    label: "Chancery",
                    method: "address",
                    values: [
                      "c/o Ministry of Foreign Affairs",
                      "Tanglin",
                      "Singapore 248163",
                    ],
                  },
                  {
                    label: "Telegram",
                    method: "other_methods",
                    values: ["https://t.me/isomer_gov_sg"],
                  },
                  {
                    label: "WhatsApp",
                    method: "other_methods",
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
          success: true,
        }),
      ),
    ],
  },
}

const EmptyFieldsParameters = {
  msw: {
    handlers: [
      http.get(DgsUrl, () =>
        HttpResponse.json({
          result: {
            records: [
              {
                description:
                  "Embassy of the Republic of Singapore - Algeria<br>should accept line break HTM tag",
                entity_name: "Sentosa",
                methods: JSON.stringify([
                  {
                    label: "Telephone",
                    method: "telephone",
                    values: ["+65-63798000 (MFA)"],
                  },
                  {
                    label: "This is empty and should not be shown",
                    method: "fax",
                    values: [],
                  },
                  {
                    label: "This should also not be shown",
                    method: "fax",
                    values: ["  "],
                  },
                ]),
                other_information: JSON.stringify({
                  label: "Other Information",
                  value: "  ",
                }),
              },
            ],
          },
          success: true,
        }),
      ),
    ],
  },
}

export const Default: Story = {
  args: {
    dataSource: {
      filters: [
        {
          fieldKey: "testFieldKey",
          fieldValue: "testFieldValue",
        },
      ],
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
    description: "[dgs:description]",
    headingLevel: 2,
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
    title: "[dgs:entity_name]",
    // to show that they can have different value from DGS,
  },
  parameters: DgsParameters,
}

export const DefaultEmptyFields: Story = {
  args: {
    dataSource: {
      filters: [
        {
          fieldKey: "testFieldKey",
          fieldValue: "testFieldValue",
        },
      ],
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
    description: "[dgs:description]",
    headingLevel: 2,
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
    title: "[dgs:entity_name]",
    // to show that they can have different value from DGS,
  },
  name: "Default (Empty Fields)",
  parameters: EmptyFieldsParameters,
}

export const Partial: Story = {
  args: {
    dataSource: {
      filters: [
        {
          fieldKey: "testFieldKey",
          fieldValue: "testFieldValue",
        },
      ],
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
    description: "This description is not from DGS",
    headingLevel: 2,
    methods: "[dgs:methods]",
    otherInformation: {
      label: "This otherInformation is not from DGS",
      value:
        "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
    },
    title: "This title is not from DGS",
  },
  name: "Part Native, Part DGS",
  parameters: DgsParameters,
}

export const Homepage: Story = {
  args: {
    dataSource: {
      filters: [
        {
          fieldKey: "testFieldKey",
          fieldValue: "testFieldValue",
        },
      ],
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
    description: "[dgs:description]",
    headingLevel: 2,
    layout: "homepage",
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
    title: "[dgs:entity_name]",
    whitelistedMethods: ["telephone", "emergency_contact", "email"],
  },
  parameters: DgsParameters,
}

export const HomepageEmptyFields: Story = {
  args: {
    dataSource: {
      filters: [
        {
          fieldKey: "testFieldKey",
          fieldValue: "testFieldValue",
        },
      ],
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
    description: "[dgs:description]",
    headingLevel: 2,
    layout: "homepage",
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
    title: "[dgs:entity_name]",
    whitelistedMethods: ["telephone", "emergency_contact", "email"],
  },
  name: "Homepage (Empty Fields)",
  parameters: EmptyFieldsParameters,
}

export const LoadingDefault: Story = {
  args: {
    dataSource: {
      filters: [
        {
          fieldKey: "testFieldKey",
          fieldValue: "testFieldValue",
        },
      ],
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
    description: "[dgs:description]",
    headingLevel: 2,
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
    title: "[dgs:entity_name]",
  },
  name: "Loading (Default)",
  parameters: {
    msw: {
      handlers: [
        http.get(DgsUrl, async () => {
          await delay("infinite")
        }),
      ],
    },
  },
}

export const LoadingHomepage: Story = {
  args: {
    dataSource: {
      filters: [
        {
          fieldKey: "testFieldKey",
          fieldValue: "testFieldValue",
        },
      ],
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
    description: "[dgs:description]",
    headingLevel: 2,
    layout: "homepage",
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
    title: "[dgs:entity_name]",
  },
  name: "Loading (Homepage)",
  parameters: {
    msw: {
      handlers: [
        http.get(DgsUrl, async () => {
          await delay("infinite")
        }),
      ],
    },
  },
}

// Note: should not show anything - this is intentional
export const Error: Story = {
  args: {
    dataSource: {
      filters: [
        {
          fieldKey: "testFieldKey",
          fieldValue: "testFieldValue",
        },
      ],
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
    description: "[dgs:description]",
    headingLevel: 2,
    methods: "[dgs:methods]",
    otherInformation: "[dgs:other_information]",
    title: "[dgs:entity_name]",
  },
  parameters: {
    docs: {
      description: {
        story: "Should not show anything - this is intentional",
      },
    },
    msw: {
      handlers: [
        http.get(
          DgsUrl,
          () =>
            new HttpResponse(null, {
              status: 500,
            }),
        ),
      ],
    },
  },
}
