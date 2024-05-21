import type { CalloutProps } from "~/interfaces"
import { Prose } from "../../native"

const Callout = ({ content, variant }: CalloutProps) => {
  return (
    <div
      className={`rounded border border-utility-info bg-utility-info-subtle p-6 [&:not(:first-child)]:mt-8`}
    >
      <Prose content={content} />
    </div>
  )
}

export default Callout
