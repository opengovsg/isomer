import type { IsomerComponent, IsomerSiteConfigProps } from "~/types"
import { renderComponent } from "~/templates/next/render"

export const renderPageContent = ({
  content,
  assetsBaseUrl,
  LinkComponent,
}: {
  content: IsomerComponent[]
  assetsBaseUrl: IsomerSiteConfigProps["assetsBaseUrl"]
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
        component: formattedComponent,
        elementKey: index,
        assetsBaseUrl,
        LinkComponent,
      })
    }
    return renderComponent({
      component,
      elementKey: index,
      assetsBaseUrl,
      LinkComponent,
    })
  })
}
