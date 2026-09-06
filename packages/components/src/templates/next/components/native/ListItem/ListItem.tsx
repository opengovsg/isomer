import type { ListItemProps } from "~/interfaces"
import { getProseContentKey } from "~/utils/getProseContentKey"

import { OrderedList } from "../OrderedList"
import { Paragraph } from "../Paragraph"
import { UnorderedList } from "../UnorderedList"

export const ListItem = ({ content, level, site }: ListItemProps) => 
  (
    <li className="my-3 pl-2 [&_>_p]:inline">
      {content.map((item) => {
        if (item.type === "paragraph") {
          return (
            <Paragraph key={getProseContentKey(item)} {...item} site={site} />
          )
        } else if (item.type === "orderedList") {
          return (
            <OrderedList
              key={getProseContentKey(item)}
              {...item}
              level={level ? level + 1 : 1}
              site={site}
            />
          )
        } else if (item.type === "unorderedList") {
          return (
            <UnorderedList
              key={getProseContentKey(item)}
              {...item}
              level={level ? level + 1 : 1}
              site={site}
            />
          )
        }
          const _: never = item
          return null
        
      })}
    </li>
  )

