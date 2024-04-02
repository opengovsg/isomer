import type { StoryFn, Meta } from "@storybook/react"
import SearchSGInputBox from "./SearchSGInputBox"
import type { SearchSGInputBoxProps } from "../../../types/SearchSGInputBox"
import { useEffect } from "react"

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
  const TEST_CLIENT_ID = "7946e346-993e-41c7-bd81-26a3999dc3f4"

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
