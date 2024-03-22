import { CalloutProps } from "~/common"
import Paragraph from "../Paragraph"

const Callout = ({ content, variant }: CalloutProps) => {
  return (
    <div className="bg-utility-info-subtle p-6 text-content-default text-lg leading-7 border border-utility-info rounded">
      <Paragraph content={content} />
    </div>
  )
}

export default Callout
