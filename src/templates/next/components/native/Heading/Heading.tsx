import type { HeadingProps } from "~/interfaces"
import { Heading as HeadingStyles } from "~/templates/next/typography/Heading"
import { getTextAsHtml } from "~/utils"

const Heading = ({ id, content, level }: Omit<HeadingProps, "type">) => {
  if (level === 2) {
    return (
      <h2
        id={id}
        className={`${HeadingStyles[2]} text-content [&:not(:first-child)]:mt-36`}
      >
        {getTextAsHtml(content)}
      </h2>
    )
  }
  if (level === 3) {
    return (
      <h3
        id={id}
        className={`${HeadingStyles[3]} text-content [&:not(:first-child)]:mt-16`}
      >
        {getTextAsHtml(content)}
      </h3>
    )
  }
  if (level === 4) {
    return (
      <h4
        id={id}
        className={`${HeadingStyles[4]} text-content [&:not(:first-child)]:mt-12`}
      >
        {getTextAsHtml(content)}
      </h4>
    )
  }
  if (level === 5) {
    return (
      <h5
        id={id}
        className={`${HeadingStyles[5]} text-content [&:not(:first-child)]:mt-7`}
      >
        {getTextAsHtml(content)}
      </h5>
    )
  }
  return (
    <h6
      id={id}
      className={`${HeadingStyles[6]} text-content [&:not(:first-child)]:mt-7`}
    >
      {getTextAsHtml(content)}
    </h6>
  )
}

export default Heading
