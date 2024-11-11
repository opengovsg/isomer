import type { OrderedListProps, ProseContent } from "~/interfaces"
import type { IsomerSchema } from "~/types"

function getTextContentOfProse(content: ProseContent): string {
  const values: string[] = []

  function recursiveSearch(
    content: ProseContent | OrderedListProps["content"],
  ) {
    content?.map((contentBlock) => {
      switch (contentBlock.type) {
        case "heading":
          values.push(
            contentBlock.content
              ?.map((textBlock) => textBlock.text.trim())
              .join(" ") || "",
          )
          break
        case "orderedList":
        case "unorderedList":
          contentBlock.content.map((listItemBlock) => {
            recursiveSearch(listItemBlock.content)
          })
          break
        case "listItem":
          recursiveSearch(contentBlock.content)
          break
        case "paragraph":
          contentBlock.content
            ?.map((paragraphContentBlock) => {
              switch (paragraphContentBlock.type) {
                case "text":
                  return paragraphContentBlock.text.trim()
                default:
                  return ""
              }
            })
            .join(" ")
          break
        case "table":
          values.push(contentBlock.attrs.caption.trim())
          break
        case "divider":
          break
        default:
          const exhaustiveCheck: never = contentBlock
          return exhaustiveCheck
      }
    })
  }

  recursiveSearch(content)
  return values.join(" ")
}

function removeLeadingSlash(str: string): string {
  return str.startsWith("/") ? str.slice(1) : str
}

export function renderComponentPreviewText({
  component,
}: {
  component: IsomerSchema["content"][number]
}): string {
  switch (component.type) {
    case "accordion":
      return component.summary
    case "callout":
      return getTextContentOfProse(component.content.content)
    case "hero":
      return "" // should not show up in the sidebar
    case "iframe":
      return "Iframe" // not supported in the sidebar yet
    case "image":
      return removeLeadingSlash(component.src)
    case "infobar":
      return component.title
    case "infocards":
      return component.title
    case "infocols":
      return component.title
    case "infopic":
      return component.title
    case "contentpic":
      const textContentOfProse = getTextContentOfProse(
        component.content.content,
      )
      return textContentOfProse === ""
        ? removeLeadingSlash(component.imageSrc)
        : textContentOfProse
    case "keystatistics":
      return component.title
    case "prose":
      return getTextContentOfProse(component.content)
    default:
      return (component as unknown as { type: string }).type || ""
  }
}
