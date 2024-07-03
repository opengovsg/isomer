import type { Meta, StoryObj } from "@storybook/react";

import type { MastheadProps } from "~/interfaces";
import Masthead from "./Masthead";

const meta: Meta<MastheadProps> = {
  title: "Next/Internal Components/Masthead",
  component: Masthead,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
};
export default meta;
type Story = StoryObj<typeof Masthead>;

// Default scenario
export const Default: Story = {
  args: {
    isStaging: false,
  },
};

export const Staging: Story = {
  args: {
    isStaging: true,
  },
};
