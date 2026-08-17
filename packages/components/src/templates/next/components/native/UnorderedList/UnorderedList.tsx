import type { UnorderedListProps } from "~/interfaces"

import { ListItem } from "../ListItem"

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
    // `mt-3` matches the item rhythm (`my-3` on ListItem) so a nested sublist
    // sits in the same vertical rhythm as its siblings. Above a top-level list
    // the preceding block's bottom margin collapses over this and wins.
    <ul
      className={`mt-3 ps-9 marker:text-base-content ${getUnorderedListType(level)}`}
    >
      {content.map((item, index) => (
        <ListItem key={index} {...item} level={level} site={site} />
      ))}
    </ul>
  )
}
