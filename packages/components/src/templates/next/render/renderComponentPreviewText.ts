import type { OrderedListProps, ProseContent } from "~/interfaces"
import type { IsomerSchema } from "~/types"

const getNonEmptyStringOrDefault = (
  value: string | undefined,
  defaultValue: string,
): string =>
  value !== undefined && value !== "" ? value : defaultValue

const getTextContentOfProse = (proseContent: ProseContent): string => {
  const values: string[] = []

  const processParagraphContent = (
    paragraphContentBlock: NonNullable<
      Extract<ProseContent[number], { type: "paragraph" }>["content"]
    >[number],
  ) => {
    switch (paragraphContentBlock.type) {
      case "text": {
        values.push(paragraphContentBlock.text.trim())
        break
      }
      case "hardBreak": {
        break
      }
      default: {
        const exhaustiveCheck: never = paragraphContentBlock
        throw new Error(`Unexpected paragraph content type: ${exhaustiveCheck}`)
      }
    }
  }

  const recursiveSearch = (
    contentBlocks: ProseContent | OrderedListProps["content"],
  ) => {
    for (const contentBlock of contentBlocks) {
      switch (contentBlock.type) {
        case "heading": {
          const headingText =
            contentBlock.content
              ?.map((textBlock) => textBlock.text.trim())
              .join(" ") ?? ""
          values.push(headingText)
          break
        }
        case "orderedList":
        case "unorderedList": {
          for (const listItemBlock of contentBlock.content) {
            recursiveSearch(listItemBlock.content)
          }
          break
        }
        case "listItem": {
          recursiveSearch(contentBlock.content)
          break
        }
        case "paragraph": {
          if (contentBlock.content !== undefined) {
            for (const paragraphContentBlock of contentBlock.content) {
              processParagraphContent(paragraphContentBlock)
            }
          }
          break
        }
        case "table": {
          values.push((contentBlock.attrs.caption ?? "").trim())
          break
        }
        case "divider": {
          break
        }
        default: {
          const exhaustiveCheck: never = contentBlock
          throw new Error(`Unexpected content block type: ${exhaustiveCheck}`)
        }
      }
    }
  }

  recursiveSearch(proseContent)
  return values.join(" ")
}

const getFilenameFromPath = (path: string): string => {
  const segments = path.split("/")
  const filename = segments.at(-1)
  return filename ?? ""
}

const getContentpicPreviewText = (
  component: Extract<IsomerSchema["content"][number], { type: "contentpic" }>,
): string => {
  const textContentOfProse = getTextContentOfProse(component.content.content)
  return textContentOfProse === ""
    ? getFilenameFromPath(component.imageSrc)
    : textContentOfProse
}

const getCollectionBlockPreviewText = (
  component: Extract<
    IsomerSchema["content"][number],
    { type: "collectionblock" }
  >,
): string => {
  if (
    component.customTitle !== undefined &&
    component.customTitle !== ""
  ) {
    return component.customTitle
  }

  if (
    component.customDescription !== undefined &&
    component.customDescription !== ""
  ) {
    return component.customDescription
  }

  return "Collection block"
}

const getFallbackPreviewText = (
  component: IsomerSchema["content"][number],
): string => {
  const fallbackComponent = component as { type?: string }
  return fallbackComponent.type ?? ""
}

export const renderComponentPreviewText = ({
  component,
}: {
  component: IsomerSchema["content"][number]
}): string => {
  switch (component.type) {
    case "accordion": {
      return component.summary
    }
    case "blockquote": {
      return component.quote
    }
    case "button": {
      return getNonEmptyStringOrDefault(component.buttonLabel, "Button")
    }
    case "callout": {
      return getTextContentOfProse(component.content.content)
    }
    case "formsg": {
      return getNonEmptyStringOrDefault(component.title, "FormSG form")
    }
    case "hero": {
      // should not show up in the sidebar
      return ""
    }
    case "iframe": {
      // not supported in the sidebar yet
      return "Iframe"
    }
    case "image": {
      return getFilenameFromPath(component.src)
    }
    case "infobar": {
      return component.title
    }
    case "infocards": {
      return component.title
    }
    case "infocols": {
      return component.title
    }
    case "infopic": {
      return component.title
    }
    case "contentpic": {
      return getContentpicPreviewText(component)
    }
    case "keystatistics": {
      return component.title
    }
    case "map": {
      return getNonEmptyStringOrDefault(component.title, "Map embed")
    }
    case "logocloud": {
      return getNonEmptyStringOrDefault(component.title, "Logo cloud")
    }
    case "prose": {
      return getTextContentOfProse(component.content)
    }
    case "audio": {
      return getNonEmptyStringOrDefault(component.title, "Audio embed")
    }
    case "video": {
      return getNonEmptyStringOrDefault(component.title, "Video embed")
    }
    case "childrenpages": {
      return "Child pages"
    }
    case "dynamicdatabanner": {
      return component.apiEndpoint
    }
    case "antiscambanner": {
      return "Anti-scam disclaimer"
    }
    case "collectionblock": {
      return getCollectionBlockPreviewText(component)
    }
    case "imagegallery": {
      return "Image Gallery"
    }
    case "contactinformation": {
      return getNonEmptyStringOrDefault(
        component.title,
        "Contact Information",
      )
    }
    case "dynamiccomponentlist": {
      return "Dynamic Component List"
    }
    default: {
      return getFallbackPreviewText(component)
    }
  }
}
