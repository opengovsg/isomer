import type { UnorderedListProps } from "~/interfaces"
import ListItem from "../ListItem"

const UnorderedList = ({ content }: UnorderedListProps) => {
  return (
    <ul className="mt-6 list-disc ps-8">
      {content.map((item, index) => (
        <ListItem key={index} {...item} />
      ))}
    </ul>
  )
}

export default UnorderedList
