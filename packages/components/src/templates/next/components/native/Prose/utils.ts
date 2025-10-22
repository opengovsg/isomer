import { ProseProps } from "~/interfaces"

export const hasContent = (content: ProseProps["content"]) => {
  // NOTE: top level is always `prose`
  return content.map(_hasContent).every(Boolean)
}

const _hasContent = (content: ProseProps["content"][number]): boolean => {
  switch (content.type) {
    // NOTE: a divider cannot have children and we consider it as content
    case "divider":
      return true
    case "paragraph":
      return !!content.content?.some((paragraphContent) => {
        return (
          (paragraphContent.type === "text" &&
            paragraphContent.text.trim() !== "") ||
          // NOTE: this means empty hard breaks will still be rendered
          paragraphContent.type === "hardBreak"
        )
      })
    case "heading":
      return !!content.content?.some((headingContent) => {
        return headingContent.text.trim() !== ""
      })
    case "orderedList":
    case "unorderedList":
      return !!content.content.some((listContent) =>
        listContent.content.some((item) => _hasContent(item)),
      )
    case "table":
      return !!content.content.some((tableRow) => {
        return tableRow.content.some((tableCell) => {
          return tableCell.content.some((cellContent) =>
            _hasContent(cellContent),
          )
        })
      })

    default:
      const missingType: never = content
      throw new Error(`Unknown content type: ${JSON.stringify(missingType)}`)
  }
}
