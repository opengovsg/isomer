import type { Resource } from "../types"

export const getResourceImage = (resource: Resource) => {
  if (resource.content.page.image) return resource.content.page.image

  const firstImageComponent = resource.content.find(
    (item: any) => item.type === "image",
  )
  return firstImageComponent
    ? {
        src: firstImageComponent.src,
        alt: firstImageComponent.alt,
      }
    : undefined
}
