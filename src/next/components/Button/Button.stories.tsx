import { Meta, StoryFn } from "@storybook/react"
import Button from "./Button"
import { ButtonProps } from "~/common"

export default {
  title: "Next/Components/Button",
  component: Button,
  argTypes: {},
} as Meta

// Template for stories
const Template: StoryFn<ButtonProps> = (args) => <Button {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  label: "Work with us",
  href: "/faq",
}

export const WithRightIcon = Template.bind({})
WithRightIcon.args = {
  label: "Work with us",
  href: "/faq",
  rightIcon: "right-arrow",
}

export const WhiteButton = Template.bind({})
WhiteButton.args = {
  label: "Work with us",
  href: "/faq",
  colorVariant: "white",
}
WhiteButton.parameters = {
  backgrounds: {
    default: "dark",
  },
}

export const WhiteButtonWithRightIcon = Template.bind({})
WhiteButtonWithRightIcon.args = {
  label: "Work with us",
  href: "/faq",
  rightIcon: "right-arrow",
  colorVariant: "white",
}
WhiteButtonWithRightIcon.parameters = {
  backgrounds: {
    default: "dark",
  },
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
