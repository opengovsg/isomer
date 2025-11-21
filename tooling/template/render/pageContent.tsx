import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSchema,
  IsomerSiteProps,
  LinkComponentType,
} from "@opengovsg/isomer-components"

import { renderComponent } from "./components"

const doesComponentHaveImage = ({
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

interface RenderPageContentParams {
  content: IsomerComponent[]
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent: LinkComponentType
  permalink: string
}

export const renderPageContent = ({
  content,
  ...rest
}: RenderPageContentParams) => {
  // Find index of first component with image
  const firstImageIndex = content.findIndex((component) =>
    doesComponentHaveImage({ component }),
  )

  let isInfopicTextOnRight = false

  return content.map((component, index) => {
    // Lazy load components with images that appear after the first image.
    // We assume that only the first image component will be visible above the fold,
    // while subsequent components should be lazy loaded to enhance the Lighthouse performance score.
    const shouldLazyLoad = index > firstImageIndex

    if (component.type === "infopic") {
      isInfopicTextOnRight = !isInfopicTextOnRight
      const formattedComponent = {
        ...component,
        isTextOnRight: isInfopicTextOnRight,
      }
      return renderComponent({
        elementKey: index,
        component: formattedComponent,
        shouldLazyLoad,
        ...rest,
      })
    }

    return renderComponent({
      elementKey: index,
      component,
      shouldLazyLoad,
      ...rest,
    })
  })
}
