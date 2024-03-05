import { Meta, StoryFn } from "@storybook/react"
import Button from "./Button"
import { ButtonProps } from "~/common"

export default {
  title: "Classic/Components/Button",
  component: Button,
  argTypes: {},
} as Meta

// Template for stories
const Template: StoryFn<ButtonProps> = (args) => <Button {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  label: "Button text",
  href: "/faq",
}

export const ExternalLinkButton = Template.bind({})
ExternalLinkButton.args = {
  label: "Button text",
  href: "https://www.google.com",
}

export const LongerButtonText = Template.bind({})
LongerButtonText.args = {
  label: "slightly longer button text",
  href: "/faq",
}