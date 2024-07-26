import type { CalloutProps } from "~/interfaces"
import { Prose } from "../../native"

const Callout = ({ content }: CalloutProps) => {
  return (
    <div
      className={`prose-headline-lg-regular rounded border border-utility-feedback-info bg-utility-feedback-info-subtle  px-5 py-4 [&:not(:first-child)]:mt-7`}
    >
      <Prose {...content} />
    </div>
  )
}

export default Callout
