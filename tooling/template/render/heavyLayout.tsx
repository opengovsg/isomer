import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import { CollectionLayout } from "@opengovsg/isomer-components/templates/next/layouts/Collection"
import { DatabaseLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/DatabaseSkeleton"
import { SearchLayout } from "@opengovsg/isomer-components/templates/next/layouts/Search"
import { getSitemapAsArray } from "@opengovsg/isomer-components/utils/getSitemapAsArray"

import { renderPageContent } from "./lightComponents"

/**
 * Heavy-route dispatcher: only Collection / Search / Database.
 * Imported solely by codegen'd pages under app/(heavy)/.
 */
export const renderHeavyLayout = (props: IsomerPageSchemaType) => {
  switch (props.layout) {
    case "collection":
      return <CollectionLayout {...props} />
    case "search":
      return <SearchLayout {...props} />
    case "database":
      return (
        <DatabaseLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    default:
      return <></>
  }
}

export const HeavyRenderEngine = (props: IsomerPageSchemaType) => {
  const renderProps: IsomerPageSchemaType = {
    ...props,
    site: {
      ...props.site,
      siteMapArray:
        props.site.siteMapArray ?? getSitemapAsArray(props.site.siteMap),
    },
  }

  return renderHeavyLayout(renderProps)
}
