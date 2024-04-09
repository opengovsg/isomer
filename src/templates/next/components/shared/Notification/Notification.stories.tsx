import { Meta, StoryFn } from "@storybook/react"
import NotificationBanner from "./Notification"
import { NotificationProps } from "~/common"

export default {
  title: "Next/Internal Components/Notification",
  component: NotificationBanner,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

const Template: StoryFn<NotificationProps> = (args) => (
  <NotificationBanner {...args} />
)

export const Default = Template.bind({})
Default.args = {
  content:
    "This site will be on maintenance from 0900 to 1400 (Standard Singapore Time) this Tuesday, 24th May. E-services may be intermittently available during this period. For more information, please reach out to <a href='mailto:hello@admin.gov.sg'>hello@admin.gov.sg</a>.",
}

export const ShortText = Template.bind({})
ShortText.args = {
  content: "This is a short notification",
}
