import type { OrderedListProps } from "~/interfaces"
import UnorderedList from "../UnorderedList"
import { BaseParagraph } from "../shared/Paragraph"
import { Paragraph } from "../../typography/Paragraph"

const OrderedList = ({ start, items }: OrderedListProps) => {
  return (
    <ol className="list-decimal ps-8 mt-6" start={start}>
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
    </ol>
  )
}

export default OrderedList
