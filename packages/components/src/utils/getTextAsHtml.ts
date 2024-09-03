import isEqual from "lodash/isEqual"

import type { HardBreakProps } from "~/interfaces"
import type { Marks, TextProps } from "~/interfaces/native/Text"

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

// Converts the text node with marks into the appropriate HTML
export const getTextAsHtml = (content?: (HardBreakProps | TextProps)[]) => {
  if (!content) {
    return ""
  }

  const output: string[] = []
  let existingLinkMark: Marks | undefined = undefined

  // At every step, we will close off all marks except for links
  // First encounter with a link, always open it first before other marks
  // Close all other marks first before closing the link mark
  content.forEach((node) => {
    if (node.type === "hardBreak") {
      output.push("<br />")
      return
    }

    const newLinkMark = node.marks?.find((mark) => mark.type === "link")
    const isLinkMarkNew =
      !!newLinkMark && !isEqual(existingLinkMark, newLinkMark)

    // Close off the existing link mark if it is different
    if (isLinkMarkNew && !!existingLinkMark) {
      output.push(`</${MARK_DOM_MAPPING.link}>`)
      existingLinkMark = undefined
    }

    // If there are no marks, just push the text
    if (!node.marks) {
      output.push(node.text)
      return
    }

    if (isLinkMarkNew) {
      existingLinkMark = newLinkMark

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
            `<${MARK_DOM_MAPPING[mark.type]} target="${mark.attrs.target ?? "_self"}" href="${mark.attrs.href}">`,
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
    output.push(node.text)

    // Close off all marks except for links
    node.marks
      .filter((mark) => mark.type !== "link")
      .forEach((mark) => {
        output.push(`</${MARK_DOM_MAPPING[mark.type]}>`)
      })
  })

  // Close off the last link mark if it exists
  if (existingLinkMark) {
    output.push(`</${MARK_DOM_MAPPING.link}>`)
  }

  return output.join("")
}
