import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import { SearchLayout } from "@opengovsg/isomer-components/templates/next/layouts/Search"
import { getSitemapAsArray } from "@opengovsg/isomer-components/utils/getSitemapAsArray"

/**
 * Used only by codegen'd search landings under app/(heavy)/.
 * Keep Collection and Database out of this module graph.
 */
export const SearchRenderEngine = (props: IsomerPageSchemaType) => {
  const renderProps: IsomerPageSchemaType = {
    ...props,
    site: {
      ...props.site,
      siteMapArray:
        props.site.siteMapArray ?? getSitemapAsArray(props.site.siteMap),
    },
  }

  if (renderProps.layout !== "search") {
    return <></>
  }

  return <SearchLayout {...renderProps} />
}
