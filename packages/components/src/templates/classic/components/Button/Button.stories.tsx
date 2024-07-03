import type { Meta, StoryObj } from "@storybook/react";

import Button from "./Button";

const meta: Meta<typeof Button> = {
  title: "Classic/Components/Button",
  component: Button,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Default scenario
export const Default: Story = {
  args: {
    label: "Button text",
    href: "/faq",
  },
};

export const ExternalLinkButton: Story = {
  args: {
    label: "Button text",
    href: "https://www.google.com",
  },
};

export const LongerButtonText: Story = {
  args: {
    label: "slightly longer button text",
    href: "/faq",
  },
};
