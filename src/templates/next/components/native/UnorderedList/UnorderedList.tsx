import type { UnorderedListProps } from "~/interfaces"
import Prose from "../Prose"

const UnorderedList = ({ content }: UnorderedListProps) => {
  return (
    <ul className="list-disc ps-8 mt-6">
      <Prose content={content} inline={true} />
    </ul>
  )
}

export default UnorderedList
