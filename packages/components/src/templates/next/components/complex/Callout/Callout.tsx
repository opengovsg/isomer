import type { CalloutProps } from "~/interfaces"
import { Prose } from "../../native"

const Callout = ({ content, LinkComponent, site }: CalloutProps) => {
  return (
    <div
      className={`prose-headline-lg-regular rounded-lg border border-utility-feedback-info bg-utility-feedback-info-subtle px-5 py-4 [&:not(:first-child)]:mt-7`}
    >
      <Prose {...content} LinkComponent={LinkComponent} site={site} />
    </div>
  )
}

export default Callout
