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
export const getTextAsHtml = (content: TextProps[]) => {
  return content
    .map((node) => {
      if (!node.marks) {
        return node.text
      }

      let output = node.text

      node.marks.forEach((mark) => {
        if (mark.type === "link") {
          output = `<${MARK_DOM_MAPPING[mark.type]} href="${
            mark.href
          }">${output}</${MARK_DOM_MAPPING[mark.type]}>`
          return
        }

        output = `<${MARK_DOM_MAPPING[mark.type]}>${output}</${
          MARK_DOM_MAPPING[mark.type]
        }>`
      })

      return output
    })
    .join("")
}
