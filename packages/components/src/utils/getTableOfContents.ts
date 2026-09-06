import type { HeadingLink } from "~/interfaces/internal/TableOfContents"
import type { IsomerComponent, IsomerSiteProps } from "~/types"

import { getTextAsHtml } from "./getTextAsHtml"

const BR_TAG_REGEX = /<br\s*\/?>/giu
const WHITESPACE_REGEX = /\s+/gu

// Generates the table of contents given the blocks of the page
export const getTableOfContents = (
  site: IsomerSiteProps,
  content: IsomerComponent[],
): HeadingLink[] =>
  content.flatMap((block) => {
    if (
      (block.type === "infocards" ||
        block.type === "infocols" ||
        block.type === "infopic" ||
        block.type === "keystatistics") &&
      block.title !== undefined &&
      block.title !== ""
    ) {
      return [
        {
          anchorLink: `#${block.id}`,
          content: block.title,
        },
      ]
    }

    if (block.type === "prose" && block.content !== undefined) {
      const result: HeadingLink[] = []

      for (const component of block.content) {
        if (component.type === "heading" && component.attrs.level === 2) {
          const headingContent = getTextAsHtml({
            content: component.content,
            site,
          })
            .replaceAll(BR_TAG_REGEX, " ")
            .replaceAll(WHITESPACE_REGEX, " ")
            .trim()

          if (headingContent !== "") {
            result.push({
              anchorLink: `#${component.attrs.id}`,
              content: headingContent,
            })
          }
        }
      }

      return result
    }

    return []
  })
