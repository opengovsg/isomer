import DOMPurify from "isomorphic-dompurify"
import isEqual from "lodash/isEqual"

import type { HardBreakProps } from "~/interfaces"
import type { Marks, TextProps } from "~/interfaces/native/Text"
import type { IsomerSiteProps } from "~/types"
import { getReferenceLinkHref } from "./getReferenceLinkHref"

type MarkTypes = Marks["type"]

const MARK_DOM_MAPPING: Record<MarkTypes, string> = {
  bold: "b",
  code: "code",
  italic: "i",
  link: "a",
  strike: "s",
  subscript: "sub",
  superscript: "sup",
  underline: "u",
}

interface GetTextAsHtmlArgs {
  site: IsomerSiteProps
  content?: (HardBreakProps | TextProps)[]
  shouldHideEmptyHardBreak?: boolean
  shouldStripContentHtmlTags?: boolean
}

// We want to prevent user-injected HTML tags from breaking the formatting
function stripHtmlTags(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

// Converts the text node with marks into the appropriate HTML
export const getTextAsHtml = ({
  site,
  content,
  shouldHideEmptyHardBreak,
  shouldStripContentHtmlTags = false, // needed for content from tiptap editor
}: GetTextAsHtmlArgs) => {
  if (!content) {
    // Note: We need to return a <br /> tag to ensure that the paragraph is not collapsed
    return shouldHideEmptyHardBreak ? "" : "<br />"
  }

  const output: string[] = []
  let previousNodeLinkMark: Marks | undefined = undefined

  // At every step, we will close off all marks except for links
  // First encounter with a link, always open it first before other marks
  // Close all other marks first before closing the link mark
  content.forEach((node) => {
    if (node.type === "hardBreak") {
      // Close off the existing link mark if it exists
      if (previousNodeLinkMark) {
        output.push(`</${MARK_DOM_MAPPING.link}>`)
        previousNodeLinkMark = undefined
      }

      output.push("<br />")
      return
    }

    const currentNodeLinkMark = node.marks?.find((mark) => mark.type === "link")
    const isLinkMarkNew =
      (!previousNodeLinkMark && !!currentNodeLinkMark) ||
      (!!previousNodeLinkMark && !currentNodeLinkMark) ||
      !isEqual(previousNodeLinkMark, currentNodeLinkMark)

    // Close off the existing link mark if it is different
    if (isLinkMarkNew && !!previousNodeLinkMark) {
      output.push(`</${MARK_DOM_MAPPING.link}>`)
      previousNodeLinkMark = undefined
    }

    // If there are no marks, just push the text
    if (!node.marks) {
      output.push(
        shouldStripContentHtmlTags ? stripHtmlTags(node.text) : node.text,
      )
      return
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

      node.marks.forEach((mark) => {
        if (mark.type === "link") {
          output.push(
            `<${MARK_DOM_MAPPING.link} target="${mark.attrs.target || "_self"}" href="${getReferenceLinkHref(mark.attrs.href ?? "", site.siteMap, site.assetsBaseUrl)}">`,
          )
        } else {
          output.push(`<${MARK_DOM_MAPPING[mark.type]}>`)
        }
      })
    } else {
      // Continue with the rest of the marks
      node.marks
        .filter((mark) => mark.type !== "link")
        .forEach((mark) => {
          output.push(`<${MARK_DOM_MAPPING[mark.type]}>`)
        })
    }

    // Push the text
    output.push(
      shouldStripContentHtmlTags ? stripHtmlTags(node.text) : node.text,
    )

    // Close off all marks except for links in reverse order
    const marksToClose = node.marks.filter((mark) => mark.type !== "link")
    while (marksToClose.length) {
      const mark = marksToClose.pop()

      if (!mark) {
        break
      }

      output.push(`</${MARK_DOM_MAPPING[mark.type]}>`)
    }
  })

  // Close off the last link mark if it exists
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (previousNodeLinkMark) {
    output.push(`</${MARK_DOM_MAPPING.link}>`)
  }

  return output.join("")
}
