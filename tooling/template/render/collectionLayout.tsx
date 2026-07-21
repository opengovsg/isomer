import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import { CollectionLayout } from "@opengovsg/isomer-components/templates/next/layouts/Collection"
import { getSitemapAsArray } from "@opengovsg/isomer-components/utils/getSitemapAsArray"

/**
 * Used only by codegen'd collection landings under app/(heavy)/.
 * Keep Search and Database out of this module graph.
 */
export const CollectionRenderEngine = (props: IsomerPageSchemaType) => {
  const renderProps: IsomerPageSchemaType = {
    ...props,
    site: {
      ...props.site,
      siteMapArray:
        props.site.siteMapArray ?? getSitemapAsArray(props.site.siteMap),
    },
  }

  if (renderProps.layout !== "collection") {
    return <></>
  }

  return <CollectionLayout {...renderProps} />
}
