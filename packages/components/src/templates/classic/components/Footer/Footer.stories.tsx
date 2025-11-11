import type { Meta, StoryObj } from "@storybook/react-vite"

import Footer from "./Footer"

const meta: Meta<typeof Footer> = {
  title: "Classic/Components/Footer",
  component: Footer,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
}
export default meta
type Story = StoryObj<typeof Footer>

// Default scenario
export const Default: Story = {
  args: {
    agencyName: "Isomer Next",
    lastUpdated: "2024-01-28",
    siteNavItems: [],
  },
}
