import type { ListItemProps } from "~/interfaces"
import OrderedList from "../OrderedList"
import Paragraph from "../Paragraph"
import UnorderedList from "../UnorderedList"

const ListItem = ({ content }: ListItemProps) => {
  return (
    <li className="my-5 pl-2 [&_p]:inline">
      {content.map((item, index) => {
        if (item.type === "paragraph") {
          return <Paragraph key={index} {...item} />
        } else if (item.type === "orderedList") {
          return <OrderedList key={index} {...item} />
        } else if (item.type === "unorderedList") {
          return <UnorderedList key={index} {...item} />
        } else {
          const _: never = item
          return <></>
        }
      })}
    </li>
  )
}

export default ListItem
