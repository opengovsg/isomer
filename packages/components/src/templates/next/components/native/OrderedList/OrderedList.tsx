import type { OrderedListProps } from "~/interfaces"
import { twMerge } from "~/lib/twMerge"

import { ListItem } from "../ListItem"
import { listStyles } from "../listStyles"

const getOrderedListType = (level?: number) => {
  // We rotate between decimal, lower-alpha and lower-roman
  if (!level || level % 3 === 0) {
    return "list-decimal"
  } else if (level % 3 === 1) {
    return "list-[lower-alpha]"
  } else {
    return "list-[lower-roman]"
  }
}

export const OrderedList = ({
  attrs,
  content,
  level,
  site,
}: OrderedListProps) => {
  return (
    // Nested sublists (level set) use `mt-3` to match the item rhythm (`my-3`
    // on ListItem). Top-level lists keep `mt-6` because preceding blocks like
    // Table or Callout have no bottom margin to collapse over a smaller value.
    <ol
      className={twMerge(
        listStyles({ isNested: !!level }),
        getOrderedListType(level),
      )}
      start={attrs?.start}
    >
      {content.map((item, index) => (
        <ListItem key={index} {...item} level={level} site={site} />
      ))}
    </ol>
  )
}
