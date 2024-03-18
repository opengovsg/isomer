import type { OrderedListProps } from "~/common"
import UnorderedList from "../UnorderedList"
import Paragraph from "../Paragraph"

const OrderedList = ({ start, items }: OrderedListProps) => {
  return (
    <ol className="list-decimal ps-8 my-2.5" start={start}>
      {items.map((item) => {
        if (typeof item === "string") {
          return (
            <li key={Math.random()} className="[&_p]:inline pl-2 my-2.5">
              <Paragraph content={item} />
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
