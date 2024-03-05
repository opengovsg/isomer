import { Meta, StoryFn } from "@storybook/react"
import Button from "./Button"
import { ButtonProps } from "~/common"

export default {
  title: "Components/Button",
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

export const Rounded = Template.bind({})
Rounded.args = {
  label: "Button text",
  href: "/faq",
  rounded: true,
}

export const GrayButton = Template.bind({})
GrayButton.args = {
  label: "Button text",
  href: "/faq",
  buttonColour: "gray-500",
  textColour: "white",
}

export const ExternalLinkButton = Template.bind({})
ExternalLinkButton.args = {
  label: "Button text",
  href: "https://www.google.com",
  openInNewTab: true,
}
