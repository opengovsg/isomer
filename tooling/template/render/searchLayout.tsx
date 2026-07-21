import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import { SearchLayout } from "@opengovsg/isomer-components/templates/next/layouts/Search"
import { getSitemapAsArray } from "@opengovsg/isomer-components/utils/getSitemapAsArray"

/**
 * Search landing only — do not import Collection/Database here.
 * Codegen'd `app/(heavy)/…` search routes import this engine alone.
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
