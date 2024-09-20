import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { renderComponent } from "~/templates/next/render"

interface RenderPageContentParams {
  content: IsomerComponent[]
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent: LinkComponentType
}

export const renderPageContent = ({
  content,
  ...rest
}: RenderPageContentParams) => {
  let isInfopicTextOnRight = false
  return content.map((component, index) => {
    if (component.type === "infopic") {
      isInfopicTextOnRight = !isInfopicTextOnRight
      const formattedComponent = {
        ...component,
        isTextOnRight: isInfopicTextOnRight,
      }
      return renderComponent({
        elementKey: index,
        component: formattedComponent,
        ...rest,
      })
    }

    return renderComponent({
      elementKey: index,
      component,
      ...rest,
    })
  })
}
