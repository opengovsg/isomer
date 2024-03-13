import type { Meta, StoryFn } from "@storybook/react"
import Button from "./Button"
import type { ButtonProps } from "~/common"

export default {
  title: "Next/Components/Button",
  component: Button,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
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
  colorScheme: "white",
}
White.parameters = {
  backgrounds: {
    default: "dark",
  },
}

export const OutlineBlack = Template.bind({})
OutlineBlack.args = {
  label: "Work with us",
  href: "/faq",
  colorScheme: "black",
  variant: "outline",
}

export const OutlineWhite = Template.bind({})
OutlineWhite.args = {
  label: "Work with us",
  href: "/faq",
  colorScheme: "white",
  variant: "outline",
}
OutlineWhite.parameters = {
  backgrounds: {
    default: "dark",
  },
}

export const GhostBlack = Template.bind({})
GhostBlack.args = {
  label: "Work with us",
  href: "/faq",
  colorScheme: "black",
  variant: "ghost",
}

export const GhostWhite = Template.bind({})
GhostWhite.args = {
  label: "Work with us",
  href: "/faq",
  colorScheme: "white",
  variant: "ghost",
}
GhostWhite.parameters = {
  backgrounds: {
    default: "dark",
  },
}

export const LinkBlack = Template.bind({})
LinkBlack.args = {
  label: "Work with us",
  href: "/faq",
  colorScheme: "black",
  variant: "link",
}

export const LinkWhite = Template.bind({})
LinkWhite.args = {
  label: "Work with us",
  href: "/faq",
  colorScheme: "white",
  variant: "link",
}
LinkWhite.parameters = {
  backgrounds: {
    default: "dark",
  },
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
