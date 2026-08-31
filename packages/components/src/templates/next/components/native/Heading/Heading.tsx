import type { HeadingProps } from "~/interfaces"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import {
  contentBlockIndexAttr,
  type ContentBlockIndexProps,
} from "../../../render/contentBlockIndex"

// `level` only selects the visual style/font size below — it no longer
// determines the rendered tag. The tag comes from `headingLevel`, computed
// by the renderer from this heading's actual position in the page, so a
// page's heading outline never skips a level regardless of what style an
// author picks.
export const Heading = ({
  attrs: { id, level, dir },
  content,
  site,
  headingLevel,
  contentBlockIndex,
}: Omit<HeadingProps, "type"> & ContentBlockIndexProps) => {
  const Tag = getHeadingTag(headingLevel)
  const textContent = getTextAsHtml({
    site,
    content,
    shouldHideEmptyHardBreak: true,
  })
  const blockIndexAttr = contentBlockIndexAttr(contentBlockIndex)

  if (level === 2) {
    return (
      <Tag
        id={id}
        className="prose-display-sm text-base-content-strong [&:not(:first-child)]:mt-14 [&:not(:last-child)]:mb-6"
        dir={dir ?? undefined}
        {...blockIndexAttr}
      >
        {textContent}
      </Tag>
    )
  }
  if (level === 3) {
    return (
      <Tag
        id={id}
        className="prose-display-xs text-base-content-strong [&:not(:first-child)]:mt-9 [&:not(:last-child)]:mb-6"
        dir={dir ?? undefined}
        {...blockIndexAttr}
      >
        {textContent}
      </Tag>
    )
  }
  if (level === 4) {
    return (
      <Tag
        id={id}
        className="prose-title-md-semibold text-base-content-strong [&:not(:first-child)]:mt-8 [&:not(:last-child)]:mb-6"
        dir={dir ?? undefined}
        {...blockIndexAttr}
      >
        {textContent}
      </Tag>
    )
  }
  if (level === 5) {
    return (
      <Tag
        id={id}
        className="prose-headline-lg-semibold text-base-content-strong [&:not(:first-child)]:mt-7 [&:not(:last-child)]:mb-6"
        dir={dir ?? undefined}
        {...blockIndexAttr}
      >
        {textContent}
      </Tag>
    )
  }
  return (
    <Tag
      id={id}
      className="prose-headline-base-semibold text-base-content-strong [&:not(:first-child)]:mt-6 [&:not(:last-child)]:mb-6"
      dir={dir ?? undefined}
      {...blockIndexAttr}
    >
      {textContent}
    </Tag>
  )
}
