import type { IsomerSchema } from "~/types"
import {
  COLLECTION_BLOCK_TYPE,
  DYNAMIC_DATA_BANNER_TYPE,
  IMAGE_GALLERY_TYPE,
} from "~/interfaces"

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
    case DYNAMIC_DATA_BANNER_TYPE:
      return false
    case "image":
    case "infopic":
    case "formsg":
    case "hero":
    case "logocloud":
    case "contentpic":
    case "iframe":
    case "map":
    case "video":
    case IMAGE_GALLERY_TYPE:
    case "childrenpages":
      return true
    case "infocards":
      return component.cards.some((card) => "imageUrl" in card)
    case COLLECTION_BLOCK_TYPE:
      return component.displayThumbnail
    case "blockquote":
      return component.imageSrc !== undefined
    default:
      const _: never = component
      return false
  }
}
