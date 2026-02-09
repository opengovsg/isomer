import type { IsomerSchema } from "~/types"

export const doesComponentHaveImage = ({
  component,
}: {
  component: IsomerSchema["content"][number]
}): boolean => {
  // While "iframe", "map", "video" do not have images, they take up page real estate
  // so we treat them as having images and return true
  // TODO: Do separate optimization for them to improve lighthouse SEO score
  switch (component.type) {
    case "accordion":
    case "keystatistics":
    case "callout":
    case "infobar":
    case "infocols":
    case "prose":
    case "dynamicdatabanner":
    case "contactinformation":
    case "dynamiccomponentlist": // The content are fetched, so they eager load has no impact
      return false
    case "image":
    case "infopic":
    case "formsg":
    case "hero":
    case "logocloud":
    case "contentpic":
    case "iframe":
    case "map":
    case "music":
    case "video":
    case "imagegallery":
    case "childrenpages":
      return true
    case "infocards":
      return component.cards.some((card) => "imageUrl" in card)
    case "collectionblock":
      return component.displayThumbnail
    case "blockquote":
      return component.imageSrc !== undefined
    default:
      const _: never = component
      return false
  }
}
