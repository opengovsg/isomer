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
  items: [
    {
      cells: [
        { type: "tableHeader", value: ["Countries"] },
        { type: "tableHeader", value: ["Date of Entry into Force"] },
        { type: "tableHeader", value: ["IIA Text"] },
        { type: "tableHeader", value: ["Some numbers"] },
        { type: "tableHeader", value: ["Remarks"] },
      ],
    },
    {
      cells: [
        { type: "tableCell", value: ["ASEAN"] },
        { type: "tableCell", value: ["2 Aug 1998"] },
        {
          type: "tableCell",
          value: [
            "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
          ],
        },
        { type: "tableCell", value: ["123,456"] },
        {
          type: "tableCell",
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
        { type: "tableCell", value: ["Bahrain"] },
        { type: "tableCell", value: ["8 Dec 2004"] },
        {
          type: "tableCell",
          value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
        },
        { type: "tableCell", value: ["123,456"] },
        {
          type: "tableCell",
          value: [""],
        },
      ],
    },
    {
      cells: [
        { type: "tableCell", value: ["Bangladesh"] },
        { type: "tableCell", value: ["19 Nov 2004"] },
        {
          type: "tableCell",
          value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
        },
        { type: "tableCell", value: ["123,456"] },
        {
          type: "tableCell",
          value: [""],
        },
      ],
    },
    {
      cells: [
        { type: "tableCell", value: ["Belarus"] },
        { type: "tableCell", value: ["13 Jan 2001"] },
        {
          type: "tableCell",
          value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
        },
        { type: "tableCell", value: ["123,456"] },
        {
          type: "tableCell",
          value: [""],
        },
      ],
    },
    {
      cells: [
        { type: "tableCell", value: ["Belgium and Luxembourg"] },
        { type: "tableCell", value: ["27 Nov 1980"] },
        {
          type: "tableCell",
          value: ["<a href='https://google.com/'>EN download (2.4 MB)</a>"],
        },
        { type: "tableCell", value: ["123,456"] },
        {
          type: "tableCell",
          value: [""],
        },
      ],
    },
  ],
}
