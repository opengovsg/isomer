import type { ListItemProps } from "~/interfaces"

import { OrderedList } from "../OrderedList"
import { Paragraph } from "../Paragraph"
import { UnorderedList } from "../UnorderedList"

export const ListItem = ({ content, level, site }: ListItemProps) => {
  return (
    <li className="my-[15px] pl-2 sm:my-5 [&_>_p]:inline">
      {content.map((item, index) => {
        if (item.type === "paragraph") {
          return <Paragraph key={index} {...item} site={site} />
        } else if (item.type === "orderedList") {
          return (
            <OrderedList
              key={index}
              {...item}
              level={!!level ? level + 1 : 1}
              site={site}
            />
          )
        } else if (item.type === "unorderedList") {
          return (
            <UnorderedList
              key={index}
              {...item}
              level={!!level ? level + 1 : 1}
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
