import type { Meta, StoryObj } from "@storybook/react"
import { http, HttpResponse } from "msw"

import { withChromaticModes } from "@isomer/storybook-config"

import type { DynamicComponentListProps } from "~/interfaces"
import { generateDgsUrl } from "~/hooks/useDgsData/fetchDataFromDgsApi"
import DynamicComponentList from "./DynamicComponentList"

const meta: Meta<DynamicComponentListProps> = {
  title: "Next/Components/DynamicComponentList",
  component: DynamicComponentList,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof DynamicComponentList>

const DgsUrl = generateDgsUrl({
  resourceId: "PLACEHOLDER_RESOURCE_ID",
  filters: {
    headerKey1: "value1",
    headerKey2: "value2",
  },
})

export const ContactInformation: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(DgsUrl, () => {
          return HttpResponse.json({
            success: true,
            result: {
              records: [
                {
                  entity_name: "Sentosa",
                  description: "Embassy of the Republic of Singapore - Algeria",
                  methods: JSON.stringify([
                    {
                      method: "person",
                      label: "Ambassador (Non-Resident)",
                      values: ["Mr MOHAMMAD Alami Musa"],
                    },
                    {
                      method: "address",
                      label: "Chancery",
                      values: ["c/o Ministry of Foreign Affairs"],
                    },
                    {
                      method: "telephone",
                      label: "Telephone",
                      values: ["+65-63798000 (MFA)"],
                    },
                    {
                      method: "fax",
                      label: "Fax",
                      values: ["+65-64747885 (MFA)"],
                    },
                    {
                      method: "email",
                      label: "Email",
                      values: ["do-not-reply@isomer.gov.sg"],
                    },
                    {
                      method: "website",
                      label: "Website",
                      values: ["https://www.isomer.gov.sg"],
                    },
                    {
                      method: "operating_hours",
                      label: "Operating Hours",
                      values: ["8.30 am to 5.00 pm"],
                    },
                    {
                      label: "Not Telegram",
                      values: [
                        "https://this-should-still-be-hyperlinked.isomer.gov.sg",
                      ],
                    },
                  ]),
                  other_information: JSON.stringify({
                    label: "Other Information",
                    value:
                      "For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
                  }),
                },
                {
                  entity_name: "Sentosa 2",
                  description:
                    "Embassy of the Republic of Singapore - Algeria 2",
                  methods: JSON.stringify([
                    {
                      method: "person",
                      label: "Ambassador (Non-Resident) 2",
                      values: ["Mr MOHAMMAD Alami Musa 2"],
                    },
                    {
                      method: "address",
                      label: "Chancery 2",
                      values: ["c/o Ministry of Foreign Affairs 2"],
                    },
                    {
                      method: "telephone",
                      label: "Telephone",
                      values: ["+65-63798000 (MFA)"],
                    },
                    {
                      method: "fax",
                      label: "Fax 2",
                      values: ["+65-64747885 (MFA) 2"],
                    },
                    {
                      method: "email",
                      label: "Email 2",
                      values: ["do-not-reply-2@isomer.gov.sg"],
                    },
                    {
                      method: "website",
                      label: "Website 2",
                      values: ["https://www.isomer-2.gov.sg"],
                    },
                    {
                      method: "operating_hours",
                      label: "Operating Hours 2",
                      values: ["8.30 am to 5.00 pm 2"],
                    },
                    {
                      label: "Not Telegram 2",
                      values: [
                        "https://this-should-still-be-hyperlinked-2.isomer.gov.sg",
                      ],
                    },
                  ]),
                  other_information: JSON.stringify({
                    label: "Other Information 2",
                    value:
                      "2 For cats and dogs enquiries, please write to this-should-not-by-hyperlinked@isomer.gov.sg. Please note that the Isomer is the <b>bold authority</b> responsible for <a href='https://this-should-not-be-showup.isomer.gov.sg'>cats and dogs matters</a>.",
                  }),
                },
              ],
            },
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
          fieldKey: "headerKey1",
          fieldValue: "value1",
        },
        {
          fieldKey: "headerKey2",
          fieldValue: "value2",
        },
      ],
    },
    component: {
      type: "contactinformation",
      title: "[dgs:entity_name]",
      description: "[dgs:description]",
      methods: "[dgs:methods]",
      otherInformation: "[dgs:other_information]",
    },
  },
}

export const ContactInformationLoading: Story = {
  name: "ContactInformation (Loading)",
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
          fieldKey: "headerKey1",
          fieldValue: "value1",
        },
        {
          fieldKey: "headerKey2",
          fieldValue: "value2",
        },
      ],
    },
    component: {
      type: "contactinformation",
      title: "[dgs:entity_name]",
      description: "[dgs:description]",
      methods: "[dgs:methods]",
      otherInformation: "[dgs:other_information]",
    },
  },
}
