import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import { DatabaseLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/DatabaseSkeleton"
import { getSitemapAsArray } from "@opengovsg/isomer-components/utils/getSitemapAsArray"

import { renderPageContent } from "./lightComponents"

/**
 * Used only by codegen'd database landings under app/(heavy)/.
 * Keep Collection and Search out of this module graph.
 * DatabaseSkeleton + light renderPageContent cover the table and content blocks.
 */
export const DatabaseRenderEngine = (props: IsomerPageSchemaType) => {
  const renderProps: IsomerPageSchemaType = {
    ...props,
    site: {
      ...props.site,
      siteMapArray:
        props.site.siteMapArray ?? getSitemapAsArray(props.site.siteMap),
    },
  }

  if (renderProps.layout !== "database") {
    return <></>
  }

  return (
    <DatabaseLayoutSkeleton
      {...renderProps}
      renderPageContent={renderPageContent}
    />
  )
}
