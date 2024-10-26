import { tv } from "~/lib/tv"
import { SKIP_TO_CONTENT_ANCHOR_ID } from "~/templates/next/constants"
import { focusVisibleHighlight } from "~/utils"

const skipToContentStyle = tv({
  extend: focusVisibleHighlight,
  base: "absolute -left-[150%] -top-[150%] -z-50 bg-base-canvas p-2 focus-visible:left-0 focus-visible:top-0 focus-visible:z-50",
})

export const SkipToContent = () => {
  return (
    <a href={`#${SKIP_TO_CONTENT_ANCHOR_ID}`} className={skipToContentStyle()}>
      Skip to main content
    </a>
  )
}
