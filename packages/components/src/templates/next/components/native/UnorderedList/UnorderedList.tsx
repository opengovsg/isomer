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
    <ul
      className={`marker:text-base-content mt-6 ps-9 ${getUnorderedListType(level)}`}
    >
      {content.map((item, index) => (
        <ListItem key={index} {...item} level={level} site={site} />
      ))}
    </ul>
  )
}
