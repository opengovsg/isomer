import type { OrderedListProps } from "~/interfaces"

import { ListItem } from "../ListItem"

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
    // `mt-3` matches the item rhythm (`my-3` on ListItem) so a nested sublist
    // sits in the same vertical rhythm as its siblings. Above a top-level list
    // the preceding block's bottom margin collapses over this and wins.
    <ol
      className={`mt-3 ps-9 marker:text-base-content ${getOrderedListType(level)}`}
      start={attrs?.start}
    >
      {content.map((item, index) => (
        <ListItem key={index} {...item} level={level} site={site} />
      ))}
    </ol>
  )
}
