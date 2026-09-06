import type { Meta, StoryObj } from "@storybook/react-vite"
import type { DynamicComponentListProps } from "~/interfaces"
import { http, HttpResponse } from "msw"
import { generateDgsUrl } from "~/hooks/useDgsData/generateDgsUrl"

import { withChromaticModes } from "@isomer/storybook-config"

import { DynamicComponentList } from "./DynamicComponentList"

const meta: Meta<DynamicComponentListProps> = {
  argTypes: {},
  component: DynamicComponentList,
  parameters: {
    chromatic: withChromaticModes(["desktop"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Components/DynamicComponentList",
}
export default meta
type Story = StoryObj<typeof DynamicComponentList>

const DgsUrl = generateDgsUrl({
  filters: {
    headerKey1: "value1",
    headerKey2: "value2",
  },
  resourceId: "PLACEHOLDER_RESOURCE_ID",
})

export const ContactInformation: Story = {
  args: {
    component: {
      description: "[dgs:description]",
      methods: "[dgs:methods]",
      otherInformation: "[dgs:other_information]",
      title: "[dgs:entity_name]",
      type: "contactinformation",
    },
    dataSource: {
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
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get(DgsUrl, () =>
          HttpResponse.json({
            result: {
              records: [
                {
                  description: "Embassy of the Republic of Singapore - Algeria",
                  entity_name: "Sentosa",
                  methods: JSON.stringify([
                    {
                      label: "Ambassador (Non-Resident)",
                      method: "person",
                      values: ["Mr MOHAMMAD Alami Musa"],
                    },
                    {
                      label: "Chancery",
                      method: "address",
                      values: ["c/o Ministry of Foreign Affairs"],
                    },
                    {
                      label: "Telephone",
                      method: "telephone",
                      values: ["+65-63798000 (MFA)"],
                    },
                    {
                      label: "Fax",
                      method: "fax",
                      values: ["+65-64747885 (MFA)"],
                    },
                    {
                      label: "Email",
                      method: "email",
                      values: ["do-not-reply@isomer.gov.sg"],
                    },
                    {
                      label: "Website",
                      method: "website",
                      values: ["https://www.isomer.gov.sg"],
                    },
                    {
                      label: "Operating Hours",
                      method: "operating_hours",
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
                  description:
                    "Embassy of the Republic of Singapore - Algeria 2",
                  entity_name: "Sentosa 2",
                  methods: JSON.stringify([
                    {
                      label: "Ambassador (Non-Resident) 2",
                      method: "person",
                      values: ["Mr MOHAMMAD Alami Musa 2"],
                    },
                    {
                      label: "Chancery 2",
                      method: "address",
                      values: ["c/o Ministry of Foreign Affairs 2"],
                    },
                    {
                      label: "Telephone",
                      method: "telephone",
                      values: ["+65-63798000 (MFA)"],
                    },
                    {
                      label: "Fax 2",
                      method: "fax",
                      values: ["+65-64747885 (MFA) 2"],
                    },
                    {
                      label: "Email 2",
                      method: "email",
                      values: ["do-not-reply-2@isomer.gov.sg"],
                    },
                    {
                      label: "Website 2",
                      method: "website",
                      values: ["https://www.isomer-2.gov.sg"],
                    },
                    {
                      label: "Operating Hours 2",
                      method: "operating_hours",
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
            success: true,
          }),
        ),
      ],
    },
  },
}

export const ContactInformationLoading: Story = {
  args: {
    component: {
      description: "[dgs:description]",
      methods: "[dgs:methods]",
      otherInformation: "[dgs:other_information]",
      title: "[dgs:entity_name]",
      type: "contactinformation",
    },
    dataSource: {
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
      resourceId: "PLACEHOLDER_RESOURCE_ID",
      type: "dgs",
    },
  },
  name: "ContactInformation (Loading)",
  parameters: {
    msw: {
      handlers: [
        http.get(
          DgsUrl,
          async () =>
            await new Promise(() => {
              // Never resolve the promise
            }),
        ),
      ],
    },
  },
}
