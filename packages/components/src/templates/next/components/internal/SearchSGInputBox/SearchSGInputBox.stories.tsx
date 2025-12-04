import type { Meta, StoryObj } from "@storybook/react-vite"

import type { NavbarSearchSGInputBoxProps } from "~/interfaces"
import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"
import { NavbarSearchSGInputBox } from "./SearchSGInputBox"

const meta: Meta<NavbarSearchSGInputBoxProps> = {
  title: "Next/Internal Components/SearchSGInputBox",
  component: NavbarSearchSGInputBox,
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
type Story = StoryObj<typeof NavbarSearchSGInputBox>

export const Default: Story = {}
