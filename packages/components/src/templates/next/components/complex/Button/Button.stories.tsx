import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ButtonProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Button } from "./Button"

const meta: Meta<ButtonProps> = {
  title: "Next/Components/Button",
  component: Button,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
  },
}
export default meta
type Story = StoryObj<typeof Button>

export const SingleButton: Story = {
  args: {
    variant: "single",
    alignment: "left",
    buttonLabel: "Apply now",
    buttonUrl: "/permits/apply",
  },
}

export const PairOfButtons: Story = {
  args: {
    variant: "pair",
    alignment: "left",
    buttonLabel: "Apply now",
    buttonUrl: "/permits/apply",
    secondaryButtonLabel: "Learn more",
    secondaryButtonUrl: "https://www.isomer.gov.sg",
  },
}

export const CenterAligned: Story = {
  name: "Pair of buttons, aligned centre",
  args: {
    variant: "pair",
    alignment: "center",
    buttonLabel: "Apply now",
    buttonUrl: "/permits/apply",
    secondaryButtonLabel: "Learn more",
    secondaryButtonUrl: "https://www.isomer.gov.sg",
  },
}
