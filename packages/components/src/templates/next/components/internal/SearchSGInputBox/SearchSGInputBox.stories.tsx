import type { Meta, StoryObj } from "@storybook/react"
import { useEffect } from "react"

import type { SearchSGInputBoxProps } from "~/interfaces"
import SearchSGInputBox from "./SearchSGInputBox"

// Template for stories
const Template = (props: Omit<SearchSGInputBoxProps, "clientId">) => {
  const TEST_CLIENT_ID = "5485bb61-2d5d-440a-bc37-91c48fc0c9d4"

  // Note: This is needed because the script tag is not rendered in the storybook
  useEffect(() => {
    const scriptTag = document.createElement("script")
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${TEST_CLIENT_ID}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [])

  return <SearchSGInputBox clientId={TEST_CLIENT_ID} {...props} />
}

const meta: Meta<SearchSGInputBoxProps> = {
  title: "Next/Internal Components/SearchSGInputBox",
  component: SearchSGInputBox,
  render: Template,
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
