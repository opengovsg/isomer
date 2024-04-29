import type { UnorderedListProps } from "~/interfaces"
import OrderedList from "../OrderedList"
import { BaseParagraph } from "../shared/Paragraph"
import { Paragraph } from "../../typography/Paragraph"

const UnorderedList = ({ items }: UnorderedListProps) => {
  return (
    <ul className="list-disc ps-8 mt-6">
      {items.map((item) => {
        if (typeof item === "string") {
          return (
            <li key={Math.random()} className="[&_p]:inline pl-2 my-5">
              <BaseParagraph
                content={item}
                className={`text-content ${Paragraph[1]}`}
              />
            </li>
          )
        } else if (item.type === "orderedlist") {
          return <OrderedList key={Math.random()} {...item} />
        } else {
          return <UnorderedList key={Math.random()} {...item} />
        }
      })}
    </ul>
  )
}

export default UnorderedList
