import type { Resource } from "../types"

export const getResourceFirstImage = (resource: Resource) => {
  if (!Array.isArray(resource.content?.content)) return undefined

  const firstImageComponent = resource.content.content.find(
    (item: any) => item.type === "image",
  )
  return firstImageComponent
    ? {
        src: firstImageComponent.src,
        alt: firstImageComponent.alt,
      }
    : undefined
}
