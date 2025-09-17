import { useEffect } from "react"

export const SEARCHSG_TEST_CLIENT_ID = "5485bb61-2d5d-440a-bc37-91c48fc0c9d4"

// Storybook decorator that sets up SearchSG script globally
// Needed because the script tag is not rendered in the storybook
export const withSearchSgSetup = (Story: any) => {
  const TEST_CLIENT_ID = SEARCHSG_TEST_CLIENT_ID

  useEffect(() => {
    const scriptTag = document.createElement("script")
    scriptTag.id = "searchsg-config"
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${TEST_CLIENT_ID}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [])

  return <Story />
}
