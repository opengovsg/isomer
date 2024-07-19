import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import LandingPage from "~/pages/index"

const meta: Meta<typeof LandingPage> = {
  title: "Pages/Landing Page",
  component: LandingPage,
}

export default meta
type Story = StoryObj<typeof LandingPage>

export const Default: Story = {
  name: "Landing Page",
  parameters: {
    chromatic: withChromaticModes(["gsib", "mobile"]),
  },
}
