import { useEffect } from "react"

export const SEARCHSG_TEST_CLIENT_ID = "5485bb61-2d5d-440a-bc37-91c48fc0c9d4"

// Storybook decorator that sets up SearchSG script globally
// Needed because the script tag is not rendered in the storybook
interface WithSearchSgSetupProps {
  pageType: "default" | "search"
}
export const withSearchSgSetup =
  ({ pageType }: WithSearchSgSetupProps = { pageType: "default" }) =>
  (Story: any) => {
    useEffect(() => {
      // Remove any existing SearchSG script
      const existingScriptTag = document.getElementById("searchsg-config")
      if (existingScriptTag) {
        existingScriptTag.remove()
      }

      const scriptTag = document.createElement("script")
      scriptTag.id = "searchsg-config"
      const pageParam = pageType === "search" ? "&page=result" : ""
      scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${SEARCHSG_TEST_CLIENT_ID}${pageParam}`
      scriptTag.setAttribute("defer", "")
      document.body.appendChild(scriptTag)

      // Cleanup function
      return () => {
        const scriptToRemove = document.getElementById("searchsg-config")
        if (scriptToRemove) {
          document.body.removeChild(scriptToRemove)
        }
      }
    }, [pageType])

    return <Story />
  }
