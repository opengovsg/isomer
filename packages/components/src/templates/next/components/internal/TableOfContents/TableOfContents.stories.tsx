import type { Meta, StoryFn } from "@storybook/react";

import type { TableOfContentsProps } from "~/interfaces";
import TableOfContents from "./TableOfContents";

export default {
  title: "Next/Internal Components/TableOfContents",
  component: TableOfContents,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<TableOfContentsProps> = (args) => (
  <TableOfContents {...args} />
);

// Default scenario
export const Default = Template.bind({});
Default.args = {
  items: [
    {
      content: "What does the New Idea Scheme proposal support?",
      anchorLink: "#introduction",
    },
    {
      content: "What does the New Idea Scheme proposal support?",
      anchorLink: "#first-paragraph",
    },
    {
      content: "Something else",
      anchorLink: "#second-paragraph",
    },
  ],
};
