import type { Meta, StoryObj } from "@storybook/react"
import pick from "lodash/pick"
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
type Story = StoryObj<typeof ContactInformation>

const NativeArgs: Partial<ContactInformationProps> = {
  type: "contactinformation",
  entityName: "Sentosa",
  entityDetails: [
    {
      label: "Ambassador (Non-Resident)",
      values: ["Mr MOHAMMAD Alami Musa"],
    },
    {
      label: "Chancery",
      values: [
        "c/o Ministry of Foreign Affairs",
        "Tanglin",
        "Singapore 248163",
      ],
    },
  ],
  description: "Embassy of the Republic of Singapore - Algeria",
  telephone: {
    label: "Telephone",
    values: ["+65-63798000 (MFA)"],
  },
  fax: {
    label: "Fax",
    values: ["+65-64747885 (MFA)"],
    caption: "Got people use meh?",
  },
  email: {
    label: "Email",
    values: ["do-not-reply@isomer.gov.sg", "do-not-reply-pelase@isomer.gov.sg"],
  },
  website: {
    label: "Website",
    values: ["https://www.isomer.gov.sg", "https://sample.isomer.gov.sg"],
  },
  emergencyContact: {
    label: "In the case of emergency",
    values: ["+65 5678 1234"],
    caption: "(after hours)",
  },
  operatingHours: {
    label: "Operating Hours",
    values: ["Mon - Fri", "8.30 am to 5.00 pm", "Sat & Sun - Closed"],
  },
  otherMethods: [
    {
      label: "Telegram",
      values: ["https://t.me/isomer_gov_sg"],
    },
    {
      label: "WhatsApp",
      values: ["+65-63798000 (MFA)"],
    },
  ],
  otherInformation: {
    label: "This is a customized header of a Other Information field",
    value:
      "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
  },
  url: "/",
  label: "I can't even help myself",
}

export const Default: Story = {
  args: NativeArgs,
}

export const Homepage2Methods: Story = {
  name: "Homepage (2 Methods)",
  args: {
    layout: "homepage",
    ...pick(NativeArgs, ["entityName", "telephone", "email", "label", "url"]),
    description:
      "This is how it looks like when there are 2 contact methods on homepage",
  },
}

export const Homepage3Methods: Story = {
  name: "Homepage (3 Methods)",
  args: {
    layout: "homepage",
    ...NativeArgs,
    description:
      "Should only render max. 3 contact methods regardless of the number of contact methods provided",
  },
}

const DgsParameters = {
  msw: {
    handlers: [
      http.get(
        generateDgsUrl({
          resourceId: "PLACEHOLDER_RESOURCE_ID",
          filters: {
            testFieldKey: "testFieldValue",
          },
        }),
        () =>
          HttpResponse.json({
            success: true,
            result: {
              records: [
                {
                  entity_name: "Sentosa",
                  description: "Embassy of the Republic of Singapore - Algeria",
                  telephone: JSON.stringify({
                    label: "Telephone",
                    values: ["+65-63798000 (MFA)"],
                  }),
                  fax: JSON.stringify({
                    label: "Fax",
                    values: ["+65-64747885 (MFA)"],
                    caption: "Got people use meh?",
                  }),
                  email: JSON.stringify({
                    label: "Email",
                    values: [
                      "do-not-reply@isomer.gov.sg",
                      "do-not-reply-pelase@isomer.gov.sg",
                    ],
                  }),
                  website: JSON.stringify({
                    label: "Website",
                    values: [
                      "https://www.isomer.gov.sg",
                      "https://sample.isomer.gov.sg",
                    ],
                  }),
                  emergency_contact: JSON.stringify({
                    label: "In the case of emergency",
                    values: ["+65 5678 1234"],
                    caption: "(after hours)",
                  }),
                  operating_hours: JSON.stringify({
                    label: "Operating Hours",
                    values: [
                      "Mon - Fri",
                      "8.30 am to 5.00 pm",
                      "Sat & Sun - Closed",
                    ],
                  }),
                  entity_details: JSON.stringify([
                    {
                      label: "Ambassador (Non-Resident)",
                      values: ["Mr MOHAMMAD Alami Musa"],
                    },
                    {
                      label: "Chancery",
                      values: [
                        "c/o Ministry of Foreign Affairs",
                        "Tanglin",
                        "Singapore 248163",
                      ],
                    },
                  ]),
                  other_methods: JSON.stringify([
                    {
                      label: "Telegram",
                      values: ["https://t.me/isomer_gov_sg"],
                    },
                    {
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

export const Dgs: Story = {
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
    entityName: "[dgs:entity_name]",
    description: "[dgs:description]",
    telephone: "[dgs:telephone]",
    fax: "[dgs:fax]",
    email: "[dgs:email]",
    website: "[dgs:website]",
    emergencyContact: "[dgs:emergency_contact]",
    operatingHours: "[dgs:operating_hours]",
    entityDetails: "[dgs:entity_details]",
    otherMethods: "[dgs:other_methods]",
    otherInformation: "[dgs:other_information]",
  },
}

export const DgsPartial: Story = {
  name: "Dgs (Part Native, Part DGS)",
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
    entityName: "This entityName is not from DGS",
    description: "This description is not from DGS",
    telephone: {
      label: "This telephone is not from DGS",
      values: ["+65-63798000 (MFA)"],
    },
    fax: "[dgs:fax]",
    email: {
      label: "This email is not from DGS",
      values: [
        "do-not-reply@isomer.gov.sg",
        "do-not-reply-pelase@isomer.gov.sg",
      ],
    },
    website: "[dgs:website]",
    entityDetails: "[dgs:entity_details]",
    otherMethods: [
      {
        label: "This otherMethod is not from DGS",
        values: ["https://t.me/isomer_gov_sg"],
      },
      {
        label: "This otherMethod is also not from DGS",
        values: ["+65-63798000 (MFA)"],
      },
    ],
    otherInformation: JSON.stringify({
      label: "This otherInformation is not from DGS",
      value:
        "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
    }),
  },
}
