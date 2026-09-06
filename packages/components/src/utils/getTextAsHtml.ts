import type { HardBreakProps } from "~/interfaces"
import type { Marks, TextProps } from "~/interfaces/native/Text"
import type { IsomerSiteProps } from "~/types"
import { sanitize } from "isomorphic-dompurify"
import { isEqual } from "lodash-es"

import { getReferenceLinkHref } from "./getReferenceLinkHref"

type MarkTypes = Marks["type"]

const MARK_DOM_MAPPING = {
  bold: "b",
  code: "code",
  italic: "i",
  link: "a",
  strike: "s",
  subscript: "sub",
  superscript: "sup",
  underline: "u",
} as const satisfies Record<MarkTypes, string>

interface GetTextAsHtmlArgs {
  site: IsomerSiteProps
  content?: (HardBreakProps | TextProps)[]
  shouldHideEmptyHardBreak?: boolean
  shouldStripContentHtmlTags?: boolean
}

// We want to prevent user-injected HTML tags from breaking the formatting
const stripHtmlTags = (input: string): string =>
  sanitize(input, { ALLOWED_TAGS: [] })

// Converts the text node with marks into the appropriate HTML
// oxlint-disable-next-line eslint/complexity -- link mark open/close state is intentionally handled in one pass
export const getTextAsHtml = ({
  site,
  content,
  shouldHideEmptyHardBreak,
  // needed for content from tiptap editor
  shouldStripContentHtmlTags = false,
}: GetTextAsHtmlArgs) => {
  if (content === undefined) {
    // Note: We need to return a <br /> tag to ensure that the paragraph is not collapsed
    return shouldHideEmptyHardBreak === true ? "" : "<br />"
  }

  const output: string[] = []
  let previousNodeLinkMark: Marks | undefined

  // At every step, we will close off all marks except for links
  // First encounter with a link, always open it first before other marks
  // Close all other marks first before closing the link mark
  for (const node of content) {
    if (node.type === "hardBreak") {
      // Close off the existing link mark if it exists
      if (previousNodeLinkMark !== undefined) {
        output.push(`</${MARK_DOM_MAPPING.link}>`)
        previousNodeLinkMark = undefined
      }

      output.push("<br />")
      continue
    }

    const currentNodeLinkMark = node.marks?.find((mark) => mark.type === "link")
    const isLinkMarkNew =
      (previousNodeLinkMark === undefined && currentNodeLinkMark !== undefined) ||
      (previousNodeLinkMark !== undefined && currentNodeLinkMark === undefined) ||
      !isEqual(previousNodeLinkMark, currentNodeLinkMark)

    // Close off the existing link mark if it is different
    if (isLinkMarkNew && previousNodeLinkMark !== undefined) {
      output.push(`</${MARK_DOM_MAPPING.link}>`)
      previousNodeLinkMark = undefined
    }

    // If there are no marks, just push the text
    if (node.marks === undefined) {
      output.push(
        shouldStripContentHtmlTags ? stripHtmlTags(node.text) : node.text,
      )
      continue
    }

    if (isLinkMarkNew) {
      previousNodeLinkMark = currentNodeLinkMark

      // Sort such that the link mark is the first item
      node.marks.sort((a, _b) => {
        if (a.type === "link") {
          return -1
        }

        return 1
      })

      for (const mark of node.marks) {
        if (mark.type === "link") {
          const { attrs } = mark
          const target =
            attrs.target !== undefined && attrs.target !== ""
              ? attrs.target
              : "_self"
          output.push(
            `<${MARK_DOM_MAPPING.link} target="${target}" href="${getReferenceLinkHref(attrs.href ?? "", site.siteMapArray, site.assetsBaseUrl)}">`,
          )
        } else {
          output.push(`<${MARK_DOM_MAPPING[mark.type]}>`)
        }
      }
    } else {
      // Continue with the rest of the marks
      for (const mark of node.marks) {
        if (mark.type !== "link") {
          output.push(`<${MARK_DOM_MAPPING[mark.type]}>`)
        }
      }
    }

    // Push the text
    output.push(
      shouldStripContentHtmlTags ? stripHtmlTags(node.text) : node.text,
    )

    // Close off all marks except for links in reverse order
    const marksToClose = node.marks.filter((mark) => mark.type !== "link")
    while (marksToClose.length > 0) {
      const mark = marksToClose.pop()

      if (mark === undefined) {
        break
      }

      output.push(`</${MARK_DOM_MAPPING[mark.type]}>`)
    }
  }

  // Close off the last link mark if it exists
  if (previousNodeLinkMark !== undefined) {
    output.push(`</${MARK_DOM_MAPPING.link}>`)
  }

  return output.join("")
}
