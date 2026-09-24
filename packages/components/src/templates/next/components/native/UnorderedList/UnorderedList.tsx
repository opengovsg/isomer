import type { UnorderedListProps } from "~/interfaces"
import { twMerge } from "~/lib/twMerge"

import { ListItem } from "../ListItem"
import { listStyles } from "../listStyles"

const getUnorderedListType = (level?: number) => {
  // We rotate between disc, circle and square
  if (!level || level % 3 === 0) {
    return "list-disc"
  } else if (level % 3 === 1) {
    return "list-[circle]"
  } else {
    return "list-[square]"
  }
}

export const UnorderedList = ({ content, level, site }: UnorderedListProps) => {
  return (
    // Nested sublists (level set) use `mt-3` to match the item rhythm (`my-3`
    // on ListItem). Top-level lists keep `mt-6` because preceding blocks like
    // Table or Callout have no bottom margin to collapse over a smaller value.
    <ul
      className={twMerge(
        listStyles({ isNested: !!level }),
        getUnorderedListType(level),
      )}
    >
      {content.map((item, index) => (
        <ListItem key={index} {...item} level={level} site={site} />
      ))}
    </ul>
  )
}
