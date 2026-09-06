import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ButtonProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Button } from "./Button"

const meta: Meta<ButtonProps> = {
  argTypes: {},
  args: {
    site: generateSiteConfig(),
  },
  component: Button,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Button",
}
export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    alignment: "left",
    buttonLabel: "Apply now",
    buttonUrl: "/permits/apply",
  },
  name: "One button",
}

export const SingleCentreAligned: Story = {
  args: {
    alignment: "center",
    buttonLabel: "Apply now",
    buttonUrl: "/permits/apply",
  },
  name: "One button, aligned centre",
}

export const TwoButtons: Story = {
  args: {
    alignment: "left",
    buttonLabel: "Apply now",
    buttonUrl: "/permits/apply",
    secondaryButtonLabel: "Learn more",
    secondaryButtonUrl: "https://www.isomer.gov.sg",
  },
  name: "Two buttons",
}

export const TwoButtonsCentreAligned: Story = {
  args: {
    ...TwoButtons.args,
    alignment: "center",
  },
  name: "Two buttons, aligned centre",
}

export const LongLabels: Story = {
  args: {
    alignment: "left",
    buttonLabel: "Apply for the Enhanced CPF Housing Grant",
    buttonUrl: "/permits/apply",
    secondaryButtonLabel: "Check your eligibility before applying",
    secondaryButtonUrl: "https://www.isomer.gov.sg",
  },
  name: "Two buttons, long text",
}

export const ExternalLink: Story = {
  args: {
    alignment: "left",
    buttonLabel: "Go to the national portal",
    buttonUrl: "https://www.isomer.gov.sg",
  },
  name: "External destination",
}

export const InternalReferenceLink: Story = {
  args: {
    alignment: "left",
    buttonLabel: "Read the guidelines",
    buttonUrl: "[resource:1:2]",
  },
  name: "Internal page reference",
}
