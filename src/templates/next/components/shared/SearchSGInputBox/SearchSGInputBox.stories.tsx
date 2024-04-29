import type { Meta, StoryFn } from "@storybook/react"
import { useEffect } from "react"
import type { SearchSGInputBoxProps } from "~/interfaces"
import SearchSGInputBox from "./SearchSGInputBox"

export default {
  title: "Next/Internal Components/SearchSGInputBox",
  component: SearchSGInputBox,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<Omit<SearchSGInputBoxProps, "clientId">> = (args) => {
  const TEST_CLIENT_ID = "5485bb61-2d5d-440a-bc37-91c48fc0c9d4"

  // Note: This is needed because the script tag is not rendered in the storybook
  useEffect(() => {
    const scriptTag = document.createElement("script")
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${TEST_CLIENT_ID}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [])

  return <SearchSGInputBox clientId={TEST_CLIENT_ID} {...args} />
}

export const Default = Template.bind({})
Default.args = {}
