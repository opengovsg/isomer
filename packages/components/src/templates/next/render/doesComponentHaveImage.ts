import type { IsomerSchema } from "~/types"
import { COLLECTION_WIDGET_TYPE, DYNAMIC_DATA_BANNER_TYPE } from "~/interfaces"

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
    case "infopic":
    case "prose":
    case DYNAMIC_DATA_BANNER_TYPE:
      return false
    case "image":
    case "hero":
    case "logocloud":
    case "contentpic":
    case "iframe":
    case "map":
    case "video":
      return true
    case "infocards":
      return component.cards.some((card) => "imageUrl" in card)
    case COLLECTION_WIDGET_TYPE:
      return component.displayThumbnail
    default:
      const _: never = component
      return false
  }
}
