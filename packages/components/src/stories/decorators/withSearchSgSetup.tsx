import type { ReactNode } from "react"

import { useSearchSgScript } from "../../hooks/useSearchSgScript"

export const SEARCHSG_TEST_CLIENT_ID = "5485bb61-2d5d-440a-bc37-91c48fc0c9d4"

// Storybook decorator that sets up SearchSG script globally
// Needed because the script tag is not rendered in the storybook
interface WithSearchSgSetupProps {
  pageType: "default" | "search"
}
const DEFAULT_WITH_SEARCH_SG_SETUP_PROPS: WithSearchSgSetupProps = {
  pageType: "default",
}

export const withSearchSgSetup = ({
  pageType,
}: WithSearchSgSetupProps = DEFAULT_WITH_SEARCH_SG_SETUP_PROPS) =>
  function WithSearchSgSetup(Story: () => ReactNode) {
    useSearchSgScript({
      clientId: SEARCHSG_TEST_CLIENT_ID,
      pageType,
      shouldLoad: true,
    })

    return <Story />
  }
