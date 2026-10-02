import { Box } from "@chakra-ui/react"
import { type Meta, type StoryObj } from "@storybook/nextjs"
import { FilterTypeChoiceModal } from "~/features/editing-experience/components/form-builder/components/FilterTypeChoiceModal"

import { withChromaticModes } from "@isomer/storybook-config"

const meta: Meta<typeof FilterTypeChoiceModal> = {
  title: "Pages/Edit Page/FilterTypeChoiceModal",
  component: FilterTypeChoiceModal,
  decorators: [
    (storyFn) => (
      <Box w="100%" h="100vh">
        {storyFn()}
      </Box>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    chromatic: {
      delay: 200,
      ...withChromaticModes(["gsib", "desktop"]),
    },
  },
  args: {
    isOpen: true,
    onClose: () => console.log("onClose"),
    onSelect: (type) => console.log("onSelect", type),
    isDateFilterEnabled: true,
  },
}

export default meta

type Story = StoryObj<typeof FilterTypeChoiceModal>

export const Default: Story = {
  name: "FilterTypeChoiceModal",
}

export const DateFilterDisabled: Story = {
  name: "FilterTypeChoiceModal (date filter disabled)",
  args: {
    isDateFilterEnabled: false,
  },
}
