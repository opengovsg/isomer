import type { Meta, StoryObj } from "@storybook/react"

import type { SearchSGInputBoxProps } from "~/interfaces"
import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"
import SearchSGInputBox from "./SearchSGInputBox"

// Template for stories
const Template = (props: Omit<SearchSGInputBoxProps, "clientId">) => {
  return <SearchSGInputBox clientId={SEARCHSG_TEST_CLIENT_ID} {...props} />
}

const meta: Meta<SearchSGInputBoxProps> = {
  title: "Next/Internal Components/SearchSGInputBox",
  component: SearchSGInputBox,
  render: Template,
  decorators: [withSearchSgSetup()],
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof SearchSGInputBox>

export const Default: Story = {}
