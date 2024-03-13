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

export const White = Template.bind({})
White.args = {
  label: "Work with us",
  href: "/faq",
  textColor: "black",
}
White.parameters = {
  backgrounds: {
    default: "dark",
  },
}

export const GhostWhiteText = Template.bind({})
GhostWhiteText.args = {
  label: "Work with us",
  href: "/faq",
  textColor: "white",
  clear: true,
}
GhostWhiteText.parameters = {
  backgrounds: {
    default: "dark",
  },
}

export const GhostBlackText = Template.bind({})
GhostBlackText.args = {
  label: "Work with us",
  href: "/faq",
  textColor: "black",
  clear: true,
}

export const OutlineWhiteText = Template.bind({})
OutlineWhiteText.args = {
  label: "Work with us",
  href: "/faq",
  textColor: "white",
  clear: true,
  outlined: true,
}
OutlineWhiteText.parameters = {
  backgrounds: {
    default: "dark",
  },
}

export const OutlineBlackText = Template.bind({})
OutlineBlackText.args = {
  label: "Work with us",
  href: "/faq",
  textColor: "black",
  clear: true,
  outlined: true,
}

export const WithRightIcon = Template.bind({})
WithRightIcon.args = {
  label: "Work with us",
  href: "/faq",
  rightIcon: "right-arrow",
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
