import type { Meta, StoryObj } from "@storybook/react-vite"

import Sitemap from "../../../../sitemap.json"
import Header from "./Header"

const meta: Meta<typeof Header> = {
  title: "Classic/Components/Header",
  component: Header,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
}
export default meta
type Story = StoryObj<typeof Header>

// Default scenario
export const Default: Story = {
  args: {
    permalink: "/hello/world",
    sitemap: Sitemap,
  },
}
