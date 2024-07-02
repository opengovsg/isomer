import type { Meta, StoryFn } from "@storybook/react";

import type { CalloutProps } from "~/interfaces";
import Callout from "./Callout";

export default {
  title: "Next/Components/Callout",
  component: Callout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<CalloutProps> = (args) => <Callout {...args} />;

// Default scenario
export const Default = Template.bind({});
Default.args = {
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
        },
      ],
    },
  ],
};
