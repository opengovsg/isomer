import type { Resource } from "../types"

export const getResourceImage = ({
  resource,
  useFallbackIfNoImage = false,
}: {
  resource: Resource
  useFallbackIfNoImage?: boolean
}) => {
  if (resource.content.page.image) return resource.content.page.image

  if (!useFallbackIfNoImage) return undefined
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
