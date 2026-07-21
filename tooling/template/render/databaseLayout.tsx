import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import { DatabaseLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/DatabaseSkeleton"
import { getSitemapAsArray } from "@opengovsg/isomer-components/utils/getSitemapAsArray"

import { renderPageContent } from "./lightComponents"

/**
 * Database landing only — do not import Collection/Search here.
 * Uses DatabaseSkeleton + light renderPageContent for content blocks.
 * Codegen'd `app/(heavy)/…` database routes import this engine alone.
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
