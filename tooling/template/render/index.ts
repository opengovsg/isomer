// TODO: update import path
// done here to ensure single file only
import { IsomerPageSchemaType } from "../../../packages/components/dist/esm/types"
import { renderLayout as renderNextLayout } from "./layout"

export const RenderEngine = (props: IsomerPageSchemaType) => {
  if (props.site.theme === "isomer-next") {
    return renderNextLayout(props)
  }

  return null
}
