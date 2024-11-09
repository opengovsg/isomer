import Ajv from "ajv"

import type { ProseContent, TextProps } from "~/interfaces"
import type { IsomerSchema } from "~/types"
import { TextSchema } from "~/interfaces"

function getTextContentOfProse(content: ProseContent): string {
  const values: string[] = []

  function recursiveSearch(obj: Record<string, unknown>) {
    const isTextSchema = new Ajv().compile(TextSchema)
    if (isTextSchema(obj)) {
      values.push((obj as TextProps).text.trim())
      return
    }
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        recursiveSearch(obj[key] as Record<string, unknown>)
      }
    }
  }

  recursiveSearch(content as unknown as Record<string, unknown>)
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
