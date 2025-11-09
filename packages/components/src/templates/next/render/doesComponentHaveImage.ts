import type { IsomerSchema } from "~/types"
import { COMPONENT_TYPES_MAP } from "~/constants"

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
    case COMPONENT_TYPES_MAP.DynamicDataBanner:
    case COMPONENT_TYPES_MAP.ContactInformation:
    case COMPONENT_TYPES_MAP.DynamicComponentList: // The content are fetched, so they eager load has no impact
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
    case COMPONENT_TYPES_MAP.ImageGallery:
    case "childrenpages":
      return true
    case "infocards":
      return component.cards.some((card) => "imageUrl" in card)
    case COMPONENT_TYPES_MAP.CollectionBlock:
      return component.displayThumbnail
    case "blockquote":
      return component.imageSrc !== undefined
    default:
      const _: never = component
      return false
  }
}
