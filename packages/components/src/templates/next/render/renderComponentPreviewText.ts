import type { OrderedListProps, ProseContent } from "~/interfaces"
import type { IsomerSchema } from "~/types"
import { COLLECTION_WIDGET_TYPE, DYNAMIC_DATA_BANNER_TYPE } from "~/interfaces"

function getTextContentOfProse(content: ProseContent): string {
  const values: string[] = []

  function recursiveSearch(
    content: ProseContent | OrderedListProps["content"],
  ) {
    content.map((contentBlock) => {
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
          contentBlock.content?.map((paragraphContentBlock) => {
            switch (paragraphContentBlock.type) {
              case "text":
                values.push(paragraphContentBlock.text.trim())
                break
              case "hardBreak":
                break
              default:
                const exhaustiveCheck: never = paragraphContentBlock
                return exhaustiveCheck
            }
          })
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

function getFilenameFromPath(path: string): string {
  return path.split("/").pop() || ""
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
      return getFilenameFromPath(component.src)
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
        ? getFilenameFromPath(component.imageSrc)
        : textContentOfProse
    case "keystatistics":
      return component.title
    case "map":
      return component.title || "Map embed"
    case "logocloud":
      return component.title
    case "prose":
      return getTextContentOfProse(component.content)
    case "video":
      return component.title || "Video embed"
    case DYNAMIC_DATA_BANNER_TYPE:
      return component.apiEndpoint
    case COLLECTION_WIDGET_TYPE:
      return (
        component.customTitle ||
        component.customDescription ||
        `Collection widget for ${component.collectionId}`
      )
    default:
      const _: never = component
      return (component as unknown as { type: string }).type || ""
  }
}
