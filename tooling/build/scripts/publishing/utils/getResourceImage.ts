import type { Resource } from "../types"

export const getResourceImage = (resource: Resource) => {
  if (resource.content.page.image) return resource.content.page.image

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
