import { renderComponent } from "~/templates/next/render"
import { IsomerComponent } from "~/types"

export const renderPageContent = ({
  content,
  LinkComponent,
}: {
  content: IsomerComponent[]
  LinkComponent: any
}) => {
  let isTextOnRight = false
  return content.map((component) => {
    if (component.type === "infopic") {
      console.log(isTextOnRight)
      isTextOnRight = !isTextOnRight
      const formattedComponent = {
        ...component,
        isTextOnRight,
      }
      return renderComponent({ component: formattedComponent, LinkComponent })
    }
    return renderComponent({ component, LinkComponent })
  })
}
