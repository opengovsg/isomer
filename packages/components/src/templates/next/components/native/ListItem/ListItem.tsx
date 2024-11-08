import type { ListItemProps } from "~/interfaces"
import OrderedList from "../OrderedList"
import Paragraph from "../Paragraph"
import UnorderedList from "../UnorderedList"

const ListItem = ({ content, level, LinkComponent, site }: ListItemProps) => {
  return (
    <li className="my-[15px] pl-2 sm:my-5 [&_>_p]:inline">
      {content.map((item, index) => {
        if (item.type === "paragraph") {
          return (
            <Paragraph
              key={index}
              {...item}
              LinkComponent={LinkComponent}
              site={site}
            />
          )
        } else if (item.type === "orderedList") {
          return (
            <OrderedList
              key={index}
              {...item}
              level={!!level ? level + 1 : 1}
              LinkComponent={LinkComponent}
              site={site}
            />
          )
        } else if (item.type === "unorderedList") {
          return (
            <UnorderedList
              key={index}
              {...item}
              level={!!level ? level + 1 : 1}
              LinkComponent={LinkComponent}
              site={site}
            />
          )
        } else {
          const _: never = item
          return <></>
        }
      })}
    </li>
  )
}

export default ListItem
