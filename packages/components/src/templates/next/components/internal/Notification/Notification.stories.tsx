import type { Meta, StoryObj } from "@storybook/react";

import type { NotificationProps } from "~/interfaces";
import NotificationBanner from "./Notification";

const meta: Meta<NotificationProps> = {
  title: "Next/Internal Components/Notification",
  component: NotificationBanner,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
};
export default meta;
type Story = StoryObj<typeof NotificationBanner>;

export const Default: Story = {
  args: {
    content:
      "This site will be on maintenance from 0900 to 1400 (Standard Singapore Time) this Tuesday, 24th May. E-services may be intermittently available during this period. For more information, please reach out to <a href='mailto:hello@admin.gov.sg'>hello@admin.gov.sg</a>.",
  },
};

export const ShortText: Story = {
  args: {
    content: "This is a short notification",
  },
};
