import { StoryFn, StoryObj, type Meta } from "@storybook/react"
import {
  BUTTON_COLOR_SCHEMES,
  BUTTON_VARIANTS,
  type ButtonProps,
} from "~/interfaces/complex/Button"
import Button from "./Button"

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

export const WithRightIcon = Template.bind({})
WithRightIcon.args = {
  label: "Work with us",
  href: "/faq",
  rightIcon: "right-arrow",
}

export const LongerButtonText = Template.bind({})
LongerButtonText.args = {
  label: "slightly longer button text",
  href: "/faq",
}

const Buttons = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      {BUTTON_COLOR_SCHEMES.flatMap((colorScheme) => {
        return (
          <div
            className={`${
              colorScheme === "black" ? "bg-white" : "bg-gray-900"
            } flex w-full flex-row items-center justify-center gap-4 p-10`}
          >
            {BUTTON_VARIANTS.map((variant) => {
              return (
                <Button
                  label="Work with us"
                  href="/faq"
                  colorScheme={colorScheme}
                  variant={variant}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export const ColorsAndVariants: StoryObj<ButtonProps> = {
  render: () => <Buttons />,
}
