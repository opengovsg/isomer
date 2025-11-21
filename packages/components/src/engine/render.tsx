import type { IsomerPageSchemaType } from "~/types"
import { renderLayout as renderNextLayout } from "~/templates/next"

export const RenderEngine = (props: IsomerPageSchemaType) => {
  if (props.site.theme === "isomer-next") {
    return renderNextLayout(props)
  }

  return null
}
