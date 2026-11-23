import type { HardBreakProps } from "~/interfaces"
import type { Marks, TextProps } from "~/interfaces/native/Text"
import type { IsomerSiteProps } from "~/types"
import DOMPurify from "isomorphic-dompurify"
import { escape, isEqual } from "lodash-es"

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
}

// Matches an escaped character reference, e.g. "&amp;nbsp;" or "&amp;#39;"
const ESCAPED_CHARACTER_REFERENCE_REGEX =
  /&amp;(#\d+|#x[\da-f]+|[a-z][a-z\d]*);/gi

// Stored text uses character references such as "&nbsp;", so let them
// through to render as characters while still escaping markup
const escapeKeepingCharacterReferences = (text: string) =>
  escape(text).replace(ESCAPED_CHARACTER_REFERENCE_REGEX, "&$1;")

// Decodes HTML into plain text, e.g. "A &amp; B&reg;" -> "A & B®"
export const getHtmlAsPlainText = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: [], RETURN_DOM_FRAGMENT: true })
    .textContent

// Converts the text node with marks into the appropriate HTML
export const getTextAsHtml = ({
  site,
  content,
  shouldHideEmptyHardBreak,
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

    const text = escapeKeepingCharacterReferences(node.text)

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
      output.push(text)
      return
    }

    if (isLinkMarkNew) {
      previousNodeLinkMark = currentNodeLinkMark

      // Sort such that the link mark is the first item
      node.marks.sort((a, b) => {
        if (a.type === "link") {
          return -1
        }

        return 1
      })

      node.marks.forEach((mark) => {
        if (mark.type === "link") {
          output.push(
            `<${MARK_DOM_MAPPING.link} target="${escape(mark.attrs.target || "_self")}" href="${escape(getReferenceLinkHref(mark.attrs.href ?? "", site.siteMapArray, site.assetsBaseUrl))}">`,
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
    output.push(text)

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
  // oxlint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (previousNodeLinkMark) {
    output.push(`</${MARK_DOM_MAPPING.link}>`)
  }

  return output.join("")
}
