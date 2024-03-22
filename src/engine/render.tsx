import type { IsomerMetaHeadSchema, IsomerPageSchema } from "~/engine"
import {
  renderLayout as renderNextLayout,
  renderComponent as renderNextComponent,
} from "~/templates/next"

export const RenderEngine = (props: IsomerPageSchema) => {
  if (props.site.theme === "isomer-next") {
    return renderNextLayout(props)
  }

  return null
}

export const RenderMetaHead = (props: IsomerMetaHeadSchema) => {
  if (props.site.theme === "isomer-next") {
    return renderNextComponent({
      component: {
        type: "metahead",
        favicon: props.site.favicon,
        title: props.page.title || props.site.siteName,
        description: props.page.description,
        noIndex: props.page.noIndex,
        layout: props.page.layout,
      },
      LinkComponent: props.LinkComponent,
    })
  }

  return null
}

export default RenderEngine
