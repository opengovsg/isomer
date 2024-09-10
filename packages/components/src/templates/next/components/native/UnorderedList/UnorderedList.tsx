import type { UnorderedListProps } from "~/interfaces"
import ListItem from "../ListItem"

const UnorderedList = ({
  content,
  LinkComponent,
  site,
}: UnorderedListProps) => {
  return (
    <ul className="mt-6 list-disc ps-8">
      {content.map((item, index) => (
        <ListItem
          key={index}
          {...item}
          LinkComponent={LinkComponent}
          site={site}
        />
      ))}
    </ul>
  )
}

export default UnorderedList
