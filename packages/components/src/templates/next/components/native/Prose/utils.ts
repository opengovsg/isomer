import type { ProseProps } from "~/interfaces"

const _hasContent = (content: ProseProps["content"][number]): boolean => {
  switch (content.type) {
    // NOTE: a divider cannot have children and we consider it as content
    case "divider": {
      return true
    }
    case "paragraph": {
      return (
        content.content?.some(
          (paragraphContent) =>
            (paragraphContent.type === "text" &&
              paragraphContent.text.trim() !== "") ||
            // NOTE: this means empty hard breaks will still be rendered
            paragraphContent.type === "hardBreak",
        ) ?? false
      )
    }
    case "heading": {
      return (
        content.content?.some(
          (headingContent) => headingContent.text.trim() !== "",
        ) ?? false
      )
    }
    case "orderedList":
    case "unorderedList": {
      return content.content.some((listContent) =>
        listContent.content.some((item) => _hasContent(item)),
      )
    }
    case "table": {
      return content.content.some((tableRow) =>
        tableRow.content.some((tableCell) =>
          tableCell.content.some((cellContent) => _hasContent(cellContent)),
        ),
      )
    }

    default: {
      const missingType: never = content
      throw new Error(`Unknown content type: ${JSON.stringify(missingType)}`)
    }
  }
}

export const hasContent = (content: ProseProps["content"]) =>
  // NOTE: top level is always `prose`
  content.map(_hasContent).some(Boolean)
