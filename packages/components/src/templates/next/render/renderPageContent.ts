import type { IsomerComponent, IsomerSiteProps } from "~/types"
import { renderComponent } from "~/templates/next/render"

export const renderPageContent = ({
  site,
  content,
  LinkComponent,
}: {
  site: IsomerSiteProps
  content: IsomerComponent[]
  LinkComponent: any
}) => {
  let isInfopicTextOnRight = false
  return content.map((component, index) => {
    if (component.type === "infopic") {
      isInfopicTextOnRight = !isInfopicTextOnRight
      const formattedComponent = {
        ...component,
        isTextOnRight: isInfopicTextOnRight,
      }
      return renderComponent({
        site,
        component: formattedComponent,
        elementKey: index,
        LinkComponent,
      })
    }
    return renderComponent({
      site,
      component,
      elementKey: index,
      LinkComponent,
    })
  })
}
