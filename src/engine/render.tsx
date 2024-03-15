import type { IsomerPageSchema } from "~/engine"
import { renderLayout as renderNextLayout } from "~/templates/next"

export const RenderEngine = (props: IsomerPageSchema) => {
  if (props.site.theme === "next") {
    return renderNextLayout(props)
  }

  return null
}

export default RenderEngine
