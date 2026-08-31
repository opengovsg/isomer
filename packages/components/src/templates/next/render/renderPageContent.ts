import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
} from "~/types"

import { doesComponentHaveImage } from "./doesComponentHaveImage"
import { renderComponent } from "./renderComponent"

interface RenderPageContentParams {
  content: IsomerComponent[]
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  permalink: string
  // Heading level applied to every top-level content block's own title.
  headingLevel: number
}

export const renderPageContent = ({
  content,
  layout,
  headingLevel,
  ...rest
}: RenderPageContentParams) => {
  const visibleContent = content
    .map((component, contentIndex) => ({ component, contentIndex }))
    .filter(({ component }) =>
      component.type === "childrenpages" ? !component.isHidden : true,
    )

  // Find index of first component with image
  const firstImageIndex = visibleContent.findIndex(({ component }) =>
    doesComponentHaveImage({ component }),
  )

  let isInfopicTextOnRight = false

  return visibleContent.map(({ component, contentIndex }, index) => {
    // Lazy load components with images that appear after the first image.
    // We assume that only the first image component will be visible above the fold,
    // while subsequent components should be lazy loaded to enhance the Lighthouse performance score.
    const shouldLazyLoad = index > firstImageIndex

    // Homepage has no dedicated page header, so its first block (expected to
    // be a Hero) is treated as the page's h1. Every other layout already has
    // a header that owns h1, so all of its blocks stay at `headingLevel`.
    const currentHeadingLevel =
      index === 0 && layout === "homepage" ? 1 : headingLevel

    if (component.type === "infopic") {
      isInfopicTextOnRight = !isInfopicTextOnRight
      const formattedComponent = {
        ...component,
        isTextOnRight: isInfopicTextOnRight,
      }
      return renderComponent({
        elementKey: index,
        contentIndex,
        component: formattedComponent,
        shouldLazyLoad,
        headingLevel: currentHeadingLevel,
        layout,
        ...rest,
      })
    }

    return renderComponent({
      elementKey: index,
      contentIndex,
      component,
      shouldLazyLoad,
      headingLevel: currentHeadingLevel,
      layout,
      ...rest,
    })
  })
}
