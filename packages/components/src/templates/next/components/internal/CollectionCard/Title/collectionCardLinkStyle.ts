import { tv } from "~/lib/tv"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"

export const collectionCardLinkStyle = tv({
  extend: groupFocusVisibleHighlight,
  base: "flex-col prose-title-md-semibold flex w-fit underline-offset-4 group-hover:underline",
})
