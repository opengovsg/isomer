import type { Meta, StoryFn } from "@storybook/react";

import type { LocalSearchInputBoxProps } from "~/interfaces";
import LocalSearchInputBox from "./LocalSearchInputBox";

export default {
  title: "Next/Internal Components/LocalSearchInputBox",
  component: LocalSearchInputBox,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<Omit<LocalSearchInputBoxProps, "searchUrl">> = (
  args,
) => <LocalSearchInputBox searchUrl="/search" {...args} />;

export const Default = Template.bind({});
Default.args = {};
