import type { UnorderedListProps } from "~/interfaces"
import ListItem from "../ListItem"

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

const UnorderedList = ({
  content,
  level,
  LinkComponent,
  site,
}: UnorderedListProps) => {
  return (
    <ul className={`mt-6 ps-8 ${getUnorderedListType(level)}`}>
      {content.map((item, index) => (
        <ListItem
          key={index}
          {...item}
          level={level}
          LinkComponent={LinkComponent}
          site={site}
        />
      ))}
    </ul>
  )
}

export default UnorderedList
