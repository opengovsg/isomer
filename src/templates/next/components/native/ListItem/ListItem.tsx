import type { ListItemProps } from "~/interfaces"
import Prose from "../Prose"

const ListItem = ({ content }: ListItemProps) => {
  return (
    <li className="[&_p]:inline pl-2 my-5">
      <Prose content={content} />
    </li>
  )
}

export default ListItem
