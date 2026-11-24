import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Box } from "@chakra-ui/react"

import { FreshFromIsomerPanel } from "./FreshFromIsomerPanel"

// The sign-in page's left-hand spotlight. Storybook serves apps/studio/public,
// so the spotlight video under /assets/fresh-from-isomer plays here as it does
// on the sign-in page.
const meta: Meta<typeof FreshFromIsomerPanel> = {
  title: "Pages/SignIn/FreshFromIsomerPanel",
  component: FreshFromIsomerPanel,
  decorators: [
    (Story) => (
      <Box p="3rem" bg="base.canvas.alt" minH="100vh">
        <Story />
      </Box>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
