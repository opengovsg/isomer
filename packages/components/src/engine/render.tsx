import type { IsomerPageSchemaType } from "~/types"
import { renderLayout as renderNextLayout } from "~/templates/next/render/renderLayout"

export const RenderEngine = (props: IsomerPageSchemaType) => {
  if (props.site.theme === "isomer-next") {
    return renderNextLayout(props)
  }

  return null
}
