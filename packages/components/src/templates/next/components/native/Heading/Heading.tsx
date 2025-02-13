import type { HeadingProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils"

const Heading = ({
  attrs: { id, level, dir },
  content,
  site,
}: Omit<HeadingProps, "type">) => {
  if (level === 2) {
    return (
      <h2
        id={id}
        className="prose-display-md text-base-content-strong [&:not(:first-child)]:mt-14"
        dir={dir ?? undefined}
      >
        {getTextAsHtml({
          site,
          content,
          shouldHideEmptyHardBreak: true,
        })}
      </h2>
    )
  }
  if (level === 3) {
    return (
      <h3
        id={id}
        className="prose-display-sm text-base-content-strong [&:not(:first-child)]:mt-9"
        dir={dir ?? undefined}
      >
        {getTextAsHtml({
          site,
          content,
          shouldHideEmptyHardBreak: true,
        })}
      </h3>
    )
  }
  if (level === 4) {
    return (
      <h4
        id={id}
        className="prose-title-md-semibold text-base-content-strong [&:not(:first-child)]:mt-8"
        dir={dir ?? undefined}
      >
        {getTextAsHtml({
          site,
          content,
          shouldHideEmptyHardBreak: true,
        })}
      </h4>
    )
  }
  if (level === 5) {
    return (
      <h5
        id={id}
        className="prose-headline-lg-semibold text-base-content-strong [&:not(:first-child)]:mt-7"
        dir={dir ?? undefined}
      >
        {getTextAsHtml({
          site,
          content,
          shouldHideEmptyHardBreak: true,
        })}
      </h5>
    )
  }
  return (
    <h6
      id={id}
      className="prose-headline-base-semibold text-base-content-strong [&:not(:first-child)]:mt-6"
      dir={dir ?? undefined}
    >
      {getTextAsHtml({
        site,
        content,
        shouldHideEmptyHardBreak: true,
      })}
    </h6>
  )
}

export default Heading
