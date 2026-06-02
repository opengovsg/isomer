import { tv } from "~/lib/tv"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"

export const collectionCardLinkStyle = tv({
  extend: groupFocusVisibleHighlight,
  base: "prose-title-md-semibold flex w-fit flex-col underline-offset-4 group-hover:underline",
})
