import { HeadingProps } from "~/common"
import { Heading as HeadingStyles } from "~/templates/next/typography/Heading"

const Heading = ({ id, content, level }: Omit<HeadingProps, "type">) => {
  if (level === 1) {
    return (
      <h1 id={id} className={`${HeadingStyles[1]} text-content`}>
        {content}
      </h1>
    )
  }
  if (level === 2) {
    return (
      <h2 id={id} className={`${HeadingStyles[2]} text-content`}>
        {content}
      </h2>
    )
  }
  if (level === 3) {
    return (
      <h3 id={id} className={`${HeadingStyles[3]} text-content`}>
        {content}
      </h3>
    )
  }
  if (level === 4) {
    return (
      <h4 id={id} className={`${HeadingStyles[4]} text-content`}>
        {content}
      </h4>
    )
  }
  if (level === 5) {
    return (
      <h5 id={id} className={`${HeadingStyles[5]} text-content`}>
        {content}
      </h5>
    )
  }
  return (
    <h6 id={id} className={`${HeadingStyles[6]} text-content`}>
      {content}
    </h6>
  )
}

export default Heading
