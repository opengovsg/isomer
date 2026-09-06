/* oxlint-disable import/no-cycle -- list components mutually render nested ordered/unordered list types */
import type { OrderedListProps } from "~/interfaces"
import { getProseContentKey } from "~/utils/getProseContentKey"
import { isDefinedNumber } from "~/utils/truthiness"

import { ListItem } from "../ListItem/ListItem"

const getOrderedListType = (level?: number) => {
  // We rotate between decimal, lower-alpha and lower-roman
  if (level === undefined || level === null || level % 3 === 0) {
    return "list-decimal"
  } else if (level % 3 === 1) {
    return "list-[lower-alpha]"
  }
  return "list-[lower-roman]"
}

export const OrderedList = ({
  attrs,
  content,
  level,
  site,
}: OrderedListProps) => (
  // Nested sublists (level set) use `mt-3` to match the item rhythm (`my-3`
  // on ListItem). Top-level lists keep `mt-6` because preceding blocks like
  // Table or Callout have no bottom margin to collapse over a smaller value.
  <ol
    className={`${isDefinedNumber(level) ? "mt-3" : "mt-6"} ps-9 marker:text-base-content ${getOrderedListType(level)}`}
    start={attrs?.start}
  >
    {content.map((item) => (
      <ListItem
        key={getProseContentKey(item)}
        {...item}
        level={level}
        site={site}
      />
    ))}
  </ol>
)
