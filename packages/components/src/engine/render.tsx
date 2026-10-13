import type { DistributedOmit } from "type-fest"
import type { IsomerPageSchemaType } from "~/types"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

import { renderLayout } from "./renderLayout"

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

  return renderLayout(renderProps)
}
