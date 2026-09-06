import type { IsomerSchema } from "~/types"

type ContentComponent = IsomerSchema["content"][number]

const COMPONENTS_WITHOUT_IMAGES = new Set<ContentComponent["type"]>([
  "accordion",
  "antiscambanner",
  "button",
  "callout",
  "contactinformation",
  "dynamiccomponentlist",
  "dynamicdatabanner",
  "infobar",
  "infocols",
  "keystatistics",
  "prose",
])

const COMPONENTS_WITH_IMAGES = new Set<ContentComponent["type"]>([
  "audio",
  "childrenpages",
  "contentpic",
  "formsg",
  "hero",
  "iframe",
  "image",
  "imagegallery",
  "infopic",
  "logocloud",
  "map",
  "video",
])

export const doesComponentHaveImage = ({
  component,
}: {
  component: ContentComponent
}): boolean => {
  // While "iframe", "map", "video" do not have images, they take up page real estate
  // so we treat them as having images and return true
  // NOTE: Do separate optimization for them to improve lighthouse SEO score
  if (COMPONENTS_WITHOUT_IMAGES.has(component.type)) {
    return false
  }

  if (COMPONENTS_WITH_IMAGES.has(component.type)) {
    return true
  }

  if (component.type === "infocards") {
    return component.cards.some((card) => "imageUrl" in card)
  }

  if (component.type === "collectionblock") {
    return component.displayThumbnail
  }

  if (component.type === "blockquote") {
    return component.imageSrc !== undefined
  }

  return false
}
