import type { Meta, StoryFn } from "@storybook/react"
import Table from "./Table"
import type { TableProps } from "~/common"

export default {
  title: "Next/Components/Table",
  component: Table,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<TableProps> = (args) => <Table {...args} />

export const Simple = Template.bind({})
Simple.args = {
  caption: "A table of IIA countries (2024)",
  rows: [
    {
      cells: [
        { variant: "tableHeader", value: "Countries" },
        { variant: "tableHeader", value: "Date of Entry into Force" },
        { variant: "tableHeader", value: "IIA Text" },
        { variant: "tableHeader", value: "Some numbers" },
        { variant: "tableHeader", value: "Remarks" },
      ],
    },
    {
      cells: [
        { variant: "tableCell", value: ["ASEAN"] },
        { variant: "tableCell", value: ["2 Aug 1998"] },
        {
          variant: "tableCell",
          value: [
            "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
          ],
        },
        { variant: "tableCell", value: ["123,456"] },
        {
          variant: "tableCell",
          value: [
            "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
            "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
            {
              type: "unorderedlist",
              items: [
                "<a href='https://google.com'>AANZFTA</a>",
                "<a href='https://google.com'>ACFTA</a>",
                "<a href='https://google.com'>AKFTA</a>",
                "<a href='https://google.com'>AIFTA</a>",
              ],
            },
          ],
        },
      ],
    },
    {
      cells: [
        { variant: "tableCell", value: ["Bahrain"] },
        { variant: "tableCell", value: ["8 Dec 2004"] },
        {
          variant: "tableCell",
          value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
        },
        { variant: "tableCell", value: ["123,456"] },
        {
          variant: "tableCell",
          value: [
            "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
            "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
            {
              type: "orderedlist",
              items: [
                "<a href='https://google.com'>AANZFTA</a>",
                "<a href='https://google.com'>ACFTA</a>",
                "<a href='https://google.com'>AKFTA</a>",
                "<a href='https://google.com'>AIFTA</a>",
              ],
            },
          ],
        },
      ],
    },
    {
      cells: [
        { variant: "tableCell", value: ["Bangladesh"] },
        { variant: "tableCell", value: ["19 Nov 2004"] },
        {
          variant: "tableCell",
          value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
        },
        { variant: "tableCell", value: ["123,456"] },
        {
          variant: "tableCell",
          value: ["Some text"],
        },
      ],
    },
    {
      cells: [
        { variant: "tableCell", value: ["Belarus"] },
        { variant: "tableCell", value: ["13 Jan 2001"] },
        {
          variant: "tableCell",
          value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
        },
        { variant: "tableCell", value: ["123,456"] },
        {
          variant: "tableCell",
          value: [""],
        },
      ],
    },
    {
      cells: [
        { variant: "tableCell", value: ["Belgium and Luxembourg"] },
        { variant: "tableCell", value: ["27 Nov 1980"] },
        {
          variant: "tableCell",
          value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
        },
        { variant: "tableCell", value: ["123,456"] },
        {
          variant: "tableCell",
          value: [""],
        },
      ],
    },
  ],
}
