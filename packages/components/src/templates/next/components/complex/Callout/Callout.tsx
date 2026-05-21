import type { CalloutProps } from "~/interfaces"

import { Prose } from "../../native/Prose"

export const Callout = ({ content, site }: CalloutProps) => {
  return (
    <div
      className={`prose-headline-lg-regular rounded-lg border border-utility-feedback-info bg-utility-feedback-info-subtle px-5 py-4 [&:not(:first-child)]:mt-7`}
    >
      <Prose {...content} site={site} />
    </div>
  )
}
