/* oxlint-disable import/no-cycle -- list components mutually render nested ordered/unordered list types */
import type { UnorderedListProps } from "~/interfaces"
import { getProseContentKey } from "~/utils/getProseContentKey"
import { isDefinedNumber } from "~/utils/truthiness"

import { ListItem } from "../ListItem/ListItem"

const getUnorderedListType = (level?: number) => {
  // We rotate between disc, circle and square
  if (level === undefined || level === null || level % 3 === 0) {
    return "list-disc"
  } else if (level % 3 === 1) {
    return "list-[circle]"
  }
  return "list-[square]"
}

export const UnorderedList = ({ content, level, site }: UnorderedListProps) => (
  // Nested sublists (level set) use `mt-3` to match the item rhythm (`my-3`
  // on ListItem). Top-level lists keep `mt-6` because preceding blocks like
  // Table or Callout have no bottom margin to collapse over a smaller value.
  <ul
    className={`${isDefinedNumber(level) ? "mt-3" : "mt-6"} ps-9 marker:text-base-content ${getUnorderedListType(level)}`}
  >
    {content.map((item) => (
      <ListItem
        key={getProseContentKey(item)}
        {...item}
        level={level}
        site={site}
      />
    ))}
  </ul>
)
