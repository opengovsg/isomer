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

export const Default: Story = {
  name: "One button",
  args: {
    alignment: "left",
    buttonLabel: "Apply now",
    buttonUrl: "/permits/apply",
  },
}

export const SingleCentreAligned: Story = {
  name: "One button, aligned centre",
  args: {
    alignment: "center",
    buttonLabel: "Apply now",
    buttonUrl: "/permits/apply",
  },
}

export const TwoButtons: Story = {
  name: "Two buttons",
  args: {
    alignment: "left",
    buttonLabel: "Apply now",
    buttonUrl: "/permits/apply",
    secondaryButtonLabel: "Learn more",
    secondaryButtonUrl: "https://www.isomer.gov.sg",
  },
}

export const TwoButtonsCentreAligned: Story = {
  name: "Two buttons, aligned centre",
  args: {
    ...TwoButtons.args,
    alignment: "center",
  },
}

export const LongLabels: Story = {
  name: "Two buttons, long text",
  args: {
    alignment: "left",
    buttonLabel: "Apply for the Enhanced CPF Housing Grant",
    buttonUrl: "/permits/apply",
    secondaryButtonLabel: "Check your eligibility before applying",
    secondaryButtonUrl: "https://www.isomer.gov.sg",
  },
}

export const ExternalLink: Story = {
  name: "External destination",
  args: {
    alignment: "left",
    buttonLabel: "Go to the national portal",
    buttonUrl: "https://www.isomer.gov.sg",
  },
}

export const InternalReferenceLink: Story = {
  name: "Internal page reference",
  args: {
    alignment: "left",
    buttonLabel: "Read the guidelines",
    buttonUrl: "[resource:1:2]",
  },
}
