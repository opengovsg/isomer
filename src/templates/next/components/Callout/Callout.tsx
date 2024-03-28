import { CalloutProps } from "~/common"
import BaseParagraph from "../shared/Paragraph"
import { Paragraph } from "../../typography/Paragraph"

const Callout = ({ content, variant }: CalloutProps) => {
  return (
    <div
      className={`bg-utility-info-subtle p-6 border border-utility-info rounded`}
    >
      <BaseParagraph
        content={content}
        className={`text-content ${Paragraph[2]}`}
      />
    </div>
  )
}

export default Callout
