import type { DistributedOmit } from "type-fest"
import type { IsomerPageSchemaType } from "~/types"
import { renderLayout as renderNextLayout } from "~/templates/next"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

export { renderPrefillText, renderComponentPreviewText } from "~/templates/next"

export const RenderEngine = (
  props: DistributedOmit<IsomerPageSchemaType, "site"> & {
    site: Omit<IsomerPageSchemaType["site"], "siteMapArray">
  },
) => {
  const renderProps = {
    ...props,
    site: {
      ...props.site,
      siteMapArray: getSitemapAsArray(props.site.siteMap),
    },
  } satisfies IsomerPageSchemaType

  if (props.site.theme === "isomer-next") {
    return renderNextLayout(renderProps)
  }

  return null
}
