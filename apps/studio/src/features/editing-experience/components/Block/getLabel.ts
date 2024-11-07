import type { IsomerSchema, ProseContent } from "@opengovsg/isomer-components"

type NestedObject = Record<string, unknown>

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

export default function getLabel(
  block: IsomerSchema["content"][number],
): string {
  // console.log(111, block)

  switch (block.type) {
    case "accordion":
      return block.summary
    case "callout":
      console.log(11111, block.content.content)
      return getTextContentOfProse(block.content.content)
    case "hero":
      return "" // should not show up in the sidebar
    case "iframe":
      return "Iframe" // not supported in the sidebar yet
    case "image":
      return removeLeadingSlash(block.src)
    case "infobar":
      return block.title
    case "infocards":
      return block.title
    case "infocols":
      return block.title
    case "infopic":
      return block.title
    case "contentpic":
      const textContentOfProse = getTextContentOfProse(block.content.content)
      return textContentOfProse === ""
        ? removeLeadingSlash(block.imageSrc)
        : textContentOfProse
    case "keystatistics":
      return block.title
    case "prose":
      return getTextContentOfProse(block.content)
    default:
      return (block as unknown as { type: string }).type || ""
  }
}
