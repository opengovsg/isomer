import type { Meta, StoryObj } from "@storybook/react-vite"
import type { NavbarSearchSGInputBoxProps } from "~/interfaces"
import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"

import { NavbarSearchSGInputBox } from "./SearchSgInputBox"

const meta: Meta<NavbarSearchSGInputBoxProps> = {
  argTypes: {},
  args: {
    clientId: SEARCHSG_TEST_CLIENT_ID,
  },
  component: NavbarSearchSGInputBox,
  decorators: [withSearchSgSetup()],
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/SearchSGInputBox",
}
export default meta
type Story = StoryObj<typeof NavbarSearchSGInputBox>

export const Default: Story = {}
