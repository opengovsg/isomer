import type { OrderedListProps } from "~/interfaces"
import ListItem from "../ListItem"

const OrderedList = ({
  attrs,
  content,
  LinkComponent,
  site,
}: OrderedListProps) => {
  return (
    <ol className="mt-6 list-decimal ps-8" start={attrs?.start}>
      {content.map((item, index) => (
        <ListItem
          key={index}
          {...item}
          LinkComponent={LinkComponent}
          site={site}
        />
      ))}
    </ol>
  )
}

export default OrderedList
