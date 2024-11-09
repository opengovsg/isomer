import type { ProseContent } from "~/interfaces"
import type { IsomerSchema } from "~/types"

type NestedObject = Record<string, unknown>

// Manually iterate through the ProseContent object to get the text content
// This is a simple recursive approach to extract text from nested content
// Much less complex than other methods like rendering to DOM and extracting text
function getTextContentOfProse(content: ProseContent): string {
  const values: string[] = []

  function recursiveSearch(obj: NestedObject) {
    // Check if the current object contains both "text" and "type: text"
    if (
      typeof obj.text === "string" &&
      typeof obj.type === "string" &&
      obj.type === "text"
    ) {
      values.push(obj.text.trim())
    }

    // Loop through each key in the object
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        // Recurse if the property is an object
        recursiveSearch(obj[key] as NestedObject)
      }
    }
  }

  recursiveSearch(content as unknown as NestedObject)
  return values.join(" ")
}

function removeLeadingSlash(str: string): string {
  return str.slice(1)
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
