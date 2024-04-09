import { Meta, StoryFn } from "@storybook/react"
import Notification from "./Notification"
import { NotificationProps } from "~/common/Notification"

export default {
  title: "Next/Components/Notification",
  component: Notification,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

const Template: StoryFn<NotificationProps> = (args) => (
  <Notification {...args} />
)

export const Default = Template.bind({})
Default.args = {
  title:
    "This site will be on maintenance from 0900 to 1400 (Standard Singapore Time) this Tuesday, 24th May. E-services may be intermittently available during this period. For more information, please reach out to <a href='mailto:hello@admin.gov.sg'>hello@admin.gov.sg</a>.",
}

export const ShortText = Template.bind({})
ShortText.args = {
  title: "This is a short notification",
}
