import type { Meta, StoryObj } from "@storybook/react"

import type { SearchSGInputBoxProps } from "~/interfaces"
import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"
import SearchSGInputBox from "./SearchSGInputBox"

const meta: Meta<SearchSGInputBoxProps> = {
  title: "Next/Internal Components/SearchSGInputBox",
  component: SearchSGInputBox,
  decorators: [withSearchSgSetup()],
  argTypes: {},
  args: {
    clientId: SEARCHSG_TEST_CLIENT_ID,
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof SearchSGInputBox>

export const Default: Story = {}
