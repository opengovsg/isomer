import type { IsomerComponent } from "~/types"
import { getDigestFromText } from "./getDigestFromText"

// if block.id is not present for heading level 2, we auto-generate one
// for use in table of contents anchor links
export const getTransformedPageContent = (
  content: IsomerComponent[],
): IsomerComponent[] => {
  return content.map((block, index) => {
    if (block.type === "prose" && block.content) {
      return {
        ...block,
        content: block.content.map((component, componentIndex) => {
          if (
            component.type === "heading" &&
            component.attrs.level === 2 &&
            component.attrs.id === undefined
          ) {
            // generate a unique hash to auto-generate anchor links
            const anchorId = getDigestFromText(
              `${JSON.stringify(component)}_${componentIndex}`,
            )
            const newAttrs = {
              ...component.attrs,
              id: anchorId,
            }

            return { ...component, attrs: newAttrs }
          } else {
            return component
          }
        }),
      }
    } else if (
      block.type === "infocards" ||
      block.type === "infocols" ||
      block.type === "infopic" ||
      block.type === "keystatistics"
    ) {
      return {
        ...block,
        id: getDigestFromText(`${JSON.stringify(block)}_${index}`),
      }
    } else {
      return block
    }
  })
}
