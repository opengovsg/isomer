import type { CalloutProps } from "~/interfaces"
import { Prose } from "../../native"

const Callout = ({ content, variant }: CalloutProps) => {
  return (
    <div
      className={`bg-utility-info-subtle p-6 border border-utility-info rounded [&:not(:first-child)]:mt-8`}
    >
      <Prose content={content} inline={true} />
    </div>
  )
}

export default Callout
