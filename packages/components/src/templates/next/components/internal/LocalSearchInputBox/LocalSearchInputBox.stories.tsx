import type { Meta, StoryObj } from "@storybook/react";

import type { LocalSearchInputBoxProps } from "~/interfaces";
import LocalSearchInputBox from "./LocalSearchInputBox";

const meta: Meta<LocalSearchInputBoxProps> = {
  title: "Next/Internal Components/LocalSearchInputBox",
  component: LocalSearchInputBox,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    searchUrl: "/search",
  },
};
export default meta;
type Story = StoryObj<typeof LocalSearchInputBox>;

export const Default: Story = {};
