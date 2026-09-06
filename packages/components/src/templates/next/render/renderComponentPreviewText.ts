import type { OrderedListProps, ProseContent } from "~/interfaces"
import type { IsomerSchema } from "~/types"

type ContentComponent = IsomerSchema["content"][number]

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
        const _exhaustiveCheck: never = paragraphContentBlock
        throw new Error("Unexpected paragraph content type")
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
          values.push(contentBlock.attrs.caption.trim())
          break
        }
        case "divider": {
          break
        }
        default: {
          const _exhaustiveCheck: never = contentBlock
          throw new Error("Unexpected content block type")
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

const previewTextHandlers = {
  accordion: (component: Extract<ContentComponent, { type: "accordion" }>) =>
    component.summary,
  antiscambanner: () => "Anti-scam disclaimer",
  audio: (component: Extract<ContentComponent, { type: "audio" }>) =>
    getNonEmptyStringOrDefault(component.title, "Audio embed"),
  blockquote: (component: Extract<ContentComponent, { type: "blockquote" }>) =>
    component.quote,
  button: (component: Extract<ContentComponent, { type: "button" }>) =>
    getNonEmptyStringOrDefault(component.buttonLabel, "Button"),
  callout: (component: Extract<ContentComponent, { type: "callout" }>) =>
    getTextContentOfProse(component.content.content),
  childrenpages: () => "Child pages",
  collectionblock: (
    component: Extract<ContentComponent, { type: "collectionblock" }>,
  ) => {
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
  },
  contactinformation: (
    component: Extract<ContentComponent, { type: "contactinformation" }>,
  ) =>
    getNonEmptyStringOrDefault(component.title, "Contact Information"),
  contentpic: (component: Extract<ContentComponent, { type: "contentpic" }>) => {
    const textContentOfProse = getTextContentOfProse(component.content.content)
    return textContentOfProse === ""
      ? getFilenameFromPath(component.imageSrc)
      : textContentOfProse
  },
  dynamiccomponentlist: () => "Dynamic Component List",
  dynamicdatabanner: (
    component: Extract<ContentComponent, { type: "dynamicdatabanner" }>,
  ) => component.apiEndpoint,
  formsg: (component: Extract<ContentComponent, { type: "formsg" }>) =>
    getNonEmptyStringOrDefault(component.title, "FormSG form"),
  hero: () => "",
  iframe: () => "Iframe",
  image: (component: Extract<ContentComponent, { type: "image" }>) =>
    getFilenameFromPath(component.src),
  imagegallery: () => "Image Gallery",
  infobar: (component: Extract<ContentComponent, { type: "infobar" }>) =>
    component.title,
  infocards: (component: Extract<ContentComponent, { type: "infocards" }>) =>
    component.title,
  infocols: (component: Extract<ContentComponent, { type: "infocols" }>) =>
    component.title,
  infopic: (component: Extract<ContentComponent, { type: "infopic" }>) =>
    component.title,
  keystatistics: (
    component: Extract<ContentComponent, { type: "keystatistics" }>,
  ) => component.title,
  logocloud: (component: Extract<ContentComponent, { type: "logocloud" }>) =>
    getNonEmptyStringOrDefault(component.title, "Logo cloud"),
  map: (component: Extract<ContentComponent, { type: "map" }>) =>
    getNonEmptyStringOrDefault(component.title, "Map embed"),
  prose: (component: Extract<ContentComponent, { type: "prose" }>) =>
    getTextContentOfProse(component.content),
  video: (component: Extract<ContentComponent, { type: "video" }>) =>
    getNonEmptyStringOrDefault(component.title, "Video embed"),
} satisfies {
  [K in ContentComponent["type"]]: (
    component: Extract<ContentComponent, { type: K }>,
  ) => string
}

const getPreviewTextForComponent = <T extends ContentComponent["type"]>(
  type: T,
  component: Extract<ContentComponent, { type: T }>,
): string => previewTextHandlers[type](component)

export const renderComponentPreviewText = ({
  component,
}: {
  component: ContentComponent
}): string => getPreviewTextForComponent(component.type, component)
