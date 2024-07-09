import type { CalloutProps } from "~/interfaces"
import { Prose } from "../../native"

const Callout = ({ content, variant }: CalloutProps) => {
  return (
    <div
      className={`border-utility-info bg-utility-info-subtle rounded border p-6 [&:not(:first-child)]:mt-8`}
    >
      <Prose {...content} />
    </div>
  )
}

export default Callout
