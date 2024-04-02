import { HeadingProps } from "~/common"
import { Heading as HeadingStyles } from "~/templates/next/typography/Heading"

const Heading = ({ id, content, level }: Omit<HeadingProps, "type">) => {
  if (level === 2) {
    return (
      <h2
        id={id}
        className={`${HeadingStyles[2]} text-content [&:not(:first-child)]:mt-36`}
      >
        {content}
      </h2>
    )
  }
  if (level === 3) {
    return (
      <h3
        id={id}
        className={`${HeadingStyles[3]} text-content [&:not(:first-child)]:mt-16`}
      >
        {content}
      </h3>
    )
  }
  if (level === 4) {
    return (
      <h4
        id={id}
        className={`${HeadingStyles[4]} text-content [&:not(:first-child)]:mt-12`}
      >
        {content}
      </h4>
    )
  }
  if (level === 5) {
    return (
      <h5
        id={id}
        className={`${HeadingStyles[5]} text-content [&:not(:first-child)]:mt-7`}
      >
        {content}
      </h5>
    )
  }
  return (
    <h6
      id={id}
      className={`${HeadingStyles[6]} text-content [&:not(:first-child)]:mt-7`}
    >
      {content}
    </h6>
  )
}

export default Heading
