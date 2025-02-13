import type { OrderedListProps } from "~/interfaces"
import ListItem from "../ListItem"

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

const OrderedList = ({
  attrs,
  content,
  level,
  LinkComponent,
  site,
}: OrderedListProps) => {
  return (
    <ol
      className={`mt-6 ps-8 ${getOrderedListType(level)}`}
      start={attrs?.start}
    >
      {content.map((item, index) => (
        <ListItem
          key={index}
          {...item}
          level={level}
          LinkComponent={LinkComponent}
          site={site}
        />
      ))}
    </ol>
  )
}

export default OrderedList
