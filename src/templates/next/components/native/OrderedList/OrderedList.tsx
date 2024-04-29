import type { OrderedListProps } from "~/interfaces"
import Prose from "../Prose"

const OrderedList = ({ start, content }: OrderedListProps) => {
  return (
    <ol className="list-decimal ps-8 mt-6" start={start}>
      <Prose content={content} />
    </ol>
  )
}

export default OrderedList
