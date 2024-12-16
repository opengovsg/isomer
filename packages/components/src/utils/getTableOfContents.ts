import type { IsomerComponent, IsomerSiteProps } from "~/engine"
import type { HeadingLink } from "~/interfaces/internal/TableOfContents"
import { getTextAsHtml } from "./getTextAsHtml"

// Generates the table of contents given the blocks of the page
export const getTableOfContents = (
  site: IsomerSiteProps,
  content: IsomerComponent[],
): HeadingLink[] => {
  return content.flatMap((block) => {
    if (
      (block.type === "infocards" ||
        block.type === "infocols" ||
        block.type === "infopic" ||
        block.type === "keystatistics") &&
      block.title
    ) {
      return [
        {
          content: block.title,
          anchorLink: `#${block.id}`,
        },
      ]
    }

    if (block.type === "prose" && block.content) {
      const result = []

      for (const component of block.content) {
        if (component.type === "heading" && component.attrs.level === 2) {
          result.push({
            content: getTextAsHtml({ site, content: component.content }),
            anchorLink: "#" + component.attrs.id,
          })
        }
      }

      return result
    }

    return []
  })
}
