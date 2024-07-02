import type { Meta, StoryFn } from "@storybook/react";

import type { ButtonProps } from "~/interfaces";
import Button from "./Button";

export default {
  title: "Classic/Components/Button",
  component: Button,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<ButtonProps> = (args) => <Button {...args} />;

// Default scenario
export const Default = Template.bind({});
Default.args = {
  label: "Button text",
  href: "/faq",
};

export const ExternalLinkButton = Template.bind({});
ExternalLinkButton.args = {
  label: "Button text",
  href: "https://www.google.com",
};

export const LongerButtonText = Template.bind({});
LongerButtonText.args = {
  label: "slightly longer button text",
  href: "/faq",
};
