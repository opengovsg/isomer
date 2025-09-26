import type { ReactNode } from "react"

import { useSearchSGScript } from "../../hooks/useSearchSGScript"

export const SEARCHSG_TEST_CLIENT_ID = "5485bb61-2d5d-440a-bc37-91c48fc0c9d4"

// Storybook decorator that sets up SearchSG script globally
// Needed because the script tag is not rendered in the storybook
interface WithSearchSgSetupProps {
  pageType: "default" | "search"
}
export const withSearchSgSetup =
  ({ pageType }: WithSearchSgSetupProps = { pageType: "default" }) =>
  (Story: () => ReactNode) => {
    useSearchSGScript({
      pageType,
      clientId: SEARCHSG_TEST_CLIENT_ID,
      shouldLoad: true,
    })

    return <Story />
  }
