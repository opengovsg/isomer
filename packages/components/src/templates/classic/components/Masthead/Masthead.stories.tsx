import type { Meta, StoryFn } from "@storybook/react";

import type { MastheadProps } from "~/interfaces";
import Masthead from "./Masthead";

export default {
  title: "Classic/Components/Masthead",
  component: Masthead,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<MastheadProps> = (args) => <Masthead {...args} />;

// Default scenario
export const Default = Template.bind({});
Default.args = {
  isStaging: false,
};

export const Staging = Template.bind({});
Staging.args = {
  isStaging: true,
};
