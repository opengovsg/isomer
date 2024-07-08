import type { HeadingProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils"

const Heading = ({
  attrs: { id, level },
  content,
}: Omit<HeadingProps, "type">) => {
  if (level === 2) {
    return (
      <h2
        id={id}
        className="text-content text-heading-02 [&:not(:first-child)]:mt-24"
      >
        {getTextAsHtml(content)}
      </h2>
    )
  }
  if (level === 3) {
    return (
      <h3
        id={id}
        className="text-content text-heading-03 [&:not(:first-child)]:mt-14"
      >
        {getTextAsHtml(content)}
      </h3>
    )
  }
  if (level === 4) {
    return (
      <h4
        id={id}
        className="text-content text-heading-04 [&:not(:first-child)]:mt-12"
      >
        {getTextAsHtml(content)}
      </h4>
    )
  }
  if (level === 5) {
    return (
      <h5
        id={id}
        className="text-content text-heading-05 [&:not(:first-child)]:mt-7"
      >
        {getTextAsHtml(content)}
      </h5>
    )
  }
  return (
    <h6
      id={id}
      className="text-content text-heading-06 [&:not(:first-child)]:mt-7"
    >
      {getTextAsHtml(content)}
    </h6>
  )
}

export default Heading
