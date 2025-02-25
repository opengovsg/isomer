import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils"

export const collectionCardLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-title-md-semibold flex w-fit flex-col underline-offset-4 group-hover:underline",
})
