import type { Resource } from "../types"

interface ImageComponent {
  type: string
  alt?: string
  src?: string
}

export const getResourceFirstImage = (
  resource: Resource,
): { alt?: string; src?: string } | undefined => {
  if (!Array.isArray(resource.content?.content)) {
    return undefined
  }

  const firstImageComponent = resource.content.content.find(
    (item: ImageComponent) => item.type === "image",
  )
  if (firstImageComponent === undefined) {
    return undefined
  }

  return {
    alt: firstImageComponent.alt,
    src: firstImageComponent.src,
  }
}
