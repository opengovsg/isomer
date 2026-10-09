import type { Meta, StoryObj } from "@storybook/nextjs"
import { Box } from "@chakra-ui/react"

import { BlockHighlightOverlay } from "./BlockHighlightOverlay"

const meta: Meta<typeof BlockHighlightOverlay> = {
  title: "Components/BlockHighlightOverlay",
  component: BlockHighlightOverlay,
  decorators: [
    (storyFn) => (
      <Box position="relative" h="16rem" bg="base.canvas.backdrop">
        {storyFn()}
      </Box>
    ),
  ],
  args: {
    top: 32,
    left: 32,
    width: 560,
    height: 140,
    label: "Info cards",
  },
}

export default meta
type Story = StoryObj<typeof BlockHighlightOverlay>

const moveHandlers = {
  onEditClick: () => undefined,
  onMoveUp: () => undefined,
  onMoveDown: () => undefined,
}

export const MiddleBlock: Story = {
  args: {
    ...moveHandlers,
    canMoveUp: true,
    canMoveDown: true,
  },
}

export const TopBlock: Story = {
  args: {
    ...moveHandlers,
    label: "Text",
    canMoveUp: false,
    canMoveDown: true,
  },
}

export const BottomBlock: Story = {
  args: {
    ...moveHandlers,
    label: "Accordion",
    canMoveUp: true,
    canMoveDown: false,
  },
}

export const FixedHero: Story = {
  args: {
    ...moveHandlers,
    label: "Hero",
    canMoveUp: false,
    canMoveDown: false,
  },
}

export const HighlightOnly: Story = {
  args: {
    label: "Text",
  },
}
