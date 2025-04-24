import type {
  BasePageAdditionalProps,
  IsomerComponent,
  IsomerPageLayoutType,
} from "~/types"
import { renderComponent } from "~/templates/next/render"
import { doesComponentHaveImage } from "./doesComponentHaveImage"

interface RenderPageContentParams
  extends Pick<
    BasePageAdditionalProps,
    "site" | "LinkComponent" | "fromStudio" | "studioProps"
  > {
  content: IsomerComponent[]
  layout: IsomerPageLayoutType
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
