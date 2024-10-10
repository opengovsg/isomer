import type { IsomerComponent } from "~/types"
import { getDigestFromText } from "./getDigestFromText"
import { getRandomNumberBetIntervals } from "./getRandomNumber"

// if block.id is not present for heading level 2, we auto-generate one
// for use in table of contents anchor links
export const getTransformedPageContent = (content: IsomerComponent[]) => {
  const transformedContent: IsomerComponent[] = []
  for (const block of content) {
    if (block.type === "prose" && block.content) {
      const transformedBlock = {
        ...block,
        content: block.content.map((component, index) => {
          if (
            component.type === "heading" &&
            component.attrs.level === 2 &&
            component.attrs.id === undefined
          ) {
            // generate a unique hash to auto-generate anchor links
            const anchorId = getDigestFromText(
              `${JSON.stringify(component)}_${index}`,
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

      transformedContent.push(transformedBlock)
    } else {
      transformedContent.push(block)
    }
  }
  return transformedContent
}
