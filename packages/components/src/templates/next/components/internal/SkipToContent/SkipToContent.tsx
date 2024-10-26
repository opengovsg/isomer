import type { SkipToContentProps } from "~/interfaces"
import { SKIP_TO_CONTENT_ANCHOR_ID } from "~/templates/next/constants"

export const SkipToContent = ({ LinkComponent = "a" }: SkipToContentProps) => {
  return (
    <LinkComponent
      href={`#${SKIP_TO_CONTENT_ANCHOR_ID}`}
      className="focus:shadow-focus absolute -left-[150%] -top-[150%] -z-50 bg-base-canvas p-2 focus:left-0 focus:top-0 focus:z-50 focus:bg-utility-highlight focus:text-base-content-strong focus:decoration-transparent focus:outline-0 focus:transition-none focus:hover:decoration-transparent"
    >
      Skip to main content
    </LinkComponent>
  )
}
